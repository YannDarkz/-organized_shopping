import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Iproduct } from '../../interfaces/item-list';

import { ShoppingListService } from '../../services/shopping-list/shopping-list.service';
import { UserDataService } from '../../services/user-data/user-data.service';
import { map, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-items',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  providers: [CurrencyPipe],
  templateUrl: './add-items.component.html',
  styleUrl: './add-items.component.scss'
})
export class AddItemsComponent {

  
  @Output() itemUpdated = new EventEmitter<void>()
  @Output() notifyAddItem = new EventEmitter<void>()
  @Output() notifyEditItem = new EventEmitter<void>()
  
  constructor(private currencyPipe: CurrencyPipe, private formBuilder: FormBuilder, private productService: ShoppingListService, private userDataService: UserDataService) { }

  currentItemCategory: string | null = null;
  currentItemId: string | null = null
  
  addItemForm = this.formBuilder.group({
    name: ['', Validators.required],
    price: ['', [Validators.required, Validators.min(0)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    category: ['', Validators.required]
  });


   formatPrice(): void {
    const priceControl = this.addItemForm.get('price');
    let value = priceControl?.value?.toString().replace(/\D/g, ''); // Remove tudo que não é dígito
    if (value) {
      // Formata o valor para centavos
      value = (parseInt(value) / 100).toFixed(2); 
      // Exibe o valor no formato de moeda
      priceControl?.setValue(value.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'), { emitEvent: false });
    }
  }

  // Chamado a cada alteração no campo de preço
  onPriceInput(event: Event): void {
    this.formatPrice();
  }



  editing: boolean = false

  


  async addItem(): Promise<void> {
    try {
      const userId = await firstValueFrom(this.userDataService.getUserId());
      const numericUserId = userId ? userId.split('|')[1]: '';

      if(!userId) {
        throw new Error('User id is Undefined')
      }

      const newItem: Iproduct = {
        ...this.addItemForm.value as Iproduct,
       userId: numericUserId, 
      };
      
      const newCategory = newItem.category?.toLowerCase();


      if (this.editing && this.currentItemId !== null) {
        if (newCategory !== this.currentItemCategory) {
          
          this.productService.deleteItem(this.currentItemCategory!, this.currentItemId).subscribe(() => {
            this.productService.addItem(newCategory!, newItem).subscribe(() => {
              this.notifyEditItem.emit();
              this.itemUpdated.emit();
            });
          });
        } else {
          this.productService.updateItem(this.currentItemCategory, this.currentItemId, newItem).subscribe(() => {
            this.notifyEditItem.emit();
            this.itemUpdated.emit();
          });
        }
      } else if (newCategory) {
        // Adiciona um novo item
        this.productService.addItem(newCategory, newItem).subscribe(() => {
          this.notifyAddItem.emit();
          this.itemUpdated.emit();
        });
      }
  
      this.addItemForm.reset();
      this.editing = false;
      this.currentItemId = null;
      this.currentItemCategory = null;
    } catch (error) {
      console.error('Erro ao obter o id do usuário',error);
    }

  }

  startEdit(item: Iproduct, category: string): void {
    this.addItemForm.patchValue(item);
    this.editing = true;
    this.currentItemId = item.id; 
    this.currentItemCategory = category;
  }

  cancelEdit() {
    this.addItemForm.reset();
    this.editing = false;
    this.currentItemId = null;
    this.currentItemCategory = null;
  }

  get itemName() {
    return this.addItemForm.get('name')!;
  }

  get itemPrice() {
    return this.addItemForm.get('price')!;
  }

  get itemQuantity() {
    return this.addItemForm.get('quantity')!;
  }

  get itemCategory() {
    return this.addItemForm.get('category')!;
  }

}
