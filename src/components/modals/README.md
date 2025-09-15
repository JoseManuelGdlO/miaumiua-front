# Modal de Confirmación de Eliminación

## ConfirmDeleteModal

Modal genérico reutilizable para confirmar acciones de eliminación en toda la aplicación.

### Características

- ✅ **Genérico**: Se puede usar en cualquier pantalla
- ✅ **Personalizable**: Títulos, descripciones y tipos de elemento configurables
- ✅ **Estados de carga**: Muestra indicador de carga durante la eliminación
- ✅ **Manejo de errores**: Integrado con el sistema de toast
- ✅ **Accesible**: Diseño accesible con iconos y colores apropiados

### Uso Básico

```tsx
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";

const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);

const handleDeleteClick = (item: ItemType) => {
  setSelectedItem(item);
  setIsDeleteModalOpen(true);
};

const handleDelete = async () => {
  if (!selectedItem) return;
  
  try {
    await deleteItemService(selectedItem.id);
    toast({ title: "Eliminado exitosamente" });
    loadItems(); // Recargar lista
  } catch (error) {
    toast({ 
      title: "Error", 
      description: "No se pudo eliminar",
      variant: "destructive" 
    });
  }
};

// En el JSX
<ConfirmDeleteModal
  open={isDeleteModalOpen}
  onOpenChange={setIsDeleteModalOpen}
  onConfirm={handleDelete}
  itemName={selectedItem?.name}
  itemType="elemento"
  title="Eliminar Elemento"
  description={`¿Estás seguro de que deseas eliminar "${selectedItem?.name}"?`}
/>
```

### Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `open` | `boolean` | ✅ | Estado de apertura del modal |
| `onOpenChange` | `(open: boolean) => void` | ✅ | Callback para cambiar el estado |
| `onConfirm` | `() => Promise<void> \| void` | ✅ | Función a ejecutar al confirmar |
| `title` | `string` | ❌ | Título personalizado del modal |
| `description` | `string` | ❌ | Descripción personalizada |
| `itemName` | `string` | ❌ | Nombre del elemento a eliminar |
| `itemType` | `string` | ❌ | Tipo de elemento (default: "elemento") |
| `loading` | `boolean` | ❌ | Estado de carga externo |

### Ejemplos de Implementación

#### Categorías de Producto
```tsx
<ConfirmDeleteModal
  open={isDeleteModalOpen}
  onOpenChange={setIsDeleteModalOpen}
  onConfirm={handleDeleteCategoria}
  itemName={selectedCategoria?.nombre}
  itemType="categoría de producto"
  title="Eliminar Categoría"
  description={`¿Estás seguro de que deseas eliminar la categoría "${selectedCategoria?.nombre}"? Esta acción no se puede deshacer y afectará todos los productos asociados.`}
/>
```

#### Pesos
```tsx
<ConfirmDeleteModal
  open={isDeleteModalOpen}
  onOpenChange={setIsDeleteModalOpen}
  onConfirm={handleDeletePeso}
  itemName={`${selectedPeso?.cantidad} ${selectedPeso?.unidad_medida}`}
  itemType="peso"
  title="Eliminar Peso"
  description={`¿Estás seguro de que deseas eliminar el peso de ${selectedPeso?.cantidad} ${selectedPeso?.unidad_medida}? Esta acción no se puede deshacer.`}
/>
```

#### Usuarios
```tsx
<ConfirmDeleteModal
  open={isDeleteModalOpen}
  onOpenChange={setIsDeleteModalOpen}
  onConfirm={handleDeleteUser}
  itemName={selectedUser?.nombre_completo}
  itemType="usuario"
  title="Eliminar Usuario"
  description={`¿Estás seguro de que deseas eliminar al usuario "${selectedUser?.nombre_completo}"? Esta acción no se puede deshacer y el usuario perderá acceso al sistema.`}
/>
```

### Patrón de Implementación

1. **Importar el modal**:
   ```tsx
   import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
   ```

2. **Agregar estados**:
   ```tsx
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);
   ```

3. **Crear función de click**:
   ```tsx
   const handleDeleteClick = (item: ItemType) => {
     setSelectedItem(item);
     setIsDeleteModalOpen(true);
   };
   ```

4. **Modificar función de eliminación**:
   ```tsx
   const handleDelete = async () => {
     if (!selectedItem) return;
     // Lógica de eliminación
   };
   ```

5. **Actualizar botón de eliminar**:
   ```tsx
   <DropdownMenuItem onClick={() => handleDeleteClick(item)}>
     <Trash2 className="mr-2 h-4 w-4" />
     Eliminar
   </DropdownMenuItem>
   ```

6. **Agregar modal al JSX**:
   ```tsx
   <ConfirmDeleteModal
     open={isDeleteModalOpen}
     onOpenChange={setIsDeleteModalOpen}
     onConfirm={handleDelete}
     // ... otras props
   />
   ```

### Ventajas

- **Consistencia**: Misma experiencia de usuario en toda la aplicación
- **Seguridad**: Doble confirmación previene eliminaciones accidentales
- **Mantenibilidad**: Un solo componente para mantener
- **Flexibilidad**: Fácil personalización para diferentes contextos
- **UX**: Feedback visual claro con estados de carga y errores
