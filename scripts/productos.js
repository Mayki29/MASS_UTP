/* scripts/productos.js */
/* Lógica para la página de gestión de productos */
const supabaseUrl = 'https://wgivejkvpksrcwmgclrp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnaXZlamt2cGtzcmN3bWdjbHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjEyMjcsImV4cCI6MjA2Njk5NzIyN30.mzyEwKXTbFpwyQdrR8w-Wdwx8A4-hnmxUUeNjCCOUtk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    // Primero, verificar si el usuario tiene una sesión activa
    checkUserSession();

    // Referencias a elementos del DOM
    const productModal = document.getElementById('productModal');
    const abrirModalBtn = document.getElementById('abrirModalBtn');
    const closeModalBtn = document.querySelector('.close-btn');
    const productForm = document.getElementById('productForm');
    const productList = document.querySelector('.product-list');
    const modalTitulo = document.getElementById('modalTitulo');
    const productIdInput = document.getElementById('productId'); // Input oculto para el ID


    // --- FUNCIONES ---

    /** Renderiza la lista de productos en el DOM */
    const renderProductos = async () => {
        const { data, error } = await supabase
            .from('productos')
            .select(`
        *,
        categorias (
          nombre,
          descripcion
        )
      `);

        if (error) {
            console.error('Error al obtener productos con categorías:', error.message);
        } else {
            console.log('Productos con categorías:', data);
        }

        // Base de datos local (array de productos)
        let productos = data

        productList.innerHTML = ''; // Limpiar la lista
        if (productos.length === 0) {
            productList.innerHTML = '<p>No hay productos para mostrar. ¡Agrega uno nuevo!</p>';
            return;
        }
        productos.forEach(producto => {
            const productDiv = document.createElement('div');
            productDiv.classList.add('product');
            productDiv.innerHTML = `
                <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.src='../assets/placeholder.png';">
                <h3>${producto.nombre}</h3>
                <p class="price">S/ ${parseFloat(producto.precio).toFixed(2)}</p>
                <p>Stock: ${producto.stock} unidades</p>
                <div class="product-actions">
                    <button class="edit" data-id="${producto.id}">Editar</button>
                    <button class="delete" data-id="${producto.id}">Eliminar</button>
                </div>
            `;
            productList.appendChild(productDiv);
        });
        saveToLocalStorage();
    };

    /** Guarda el array de productos en localStorage */
    const saveToLocalStorage = () => {
        localStorage.setItem('productos', JSON.stringify(productos));
    };

    /** Abre el modal, reseteando el formulario para un nuevo producto */
    const openNewModal = async () => {
        modalTitulo.textContent = "Nuevo Producto";
        productForm.reset();
        productIdInput.value = ''; // Asegura que no estemos en modo edición
        productModal.style.display = "block";
        const { data, error } = await supabase
            .from('categorias')
            .select('*')
            .order('nombre', { ascending: true }); // opcional: ordenar alfabéticamente

        if (error) {
            console.error('Error al cargar categorías:', error.message);
            return;
        }

        const select = document.getElementById('categoria');
        data.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nombre;
            select.appendChild(option);
        });
    };


    /** Abre el modal para editar, poblando el formulario con datos existentes */
    const openEditModal = (id) => {
        const producto = productos.find(p => p.id === id);
        if (!producto) return;

        modalTitulo.textContent = "Editar Producto";
        productIdInput.value = producto.id;
        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('precio').value = producto.precio;
        document.getElementById('stock').value = producto.stock;
        document.getElementById('categoria').value = producto.categoria || '';
        document.getElementById('fecha').value = producto.fecha || '';
        // Aquí podrías manejar la imagen si tuvieras un input file

        productModal.style.display = "block";
    };

    /** Cierra el modal */
    const closeModal = () => {
        productModal.style.display = "none";
    };

    // --- EVENT LISTENERS ---

    // Abrir modal para nuevo producto
    abrirModalBtn.addEventListener('click', openNewModal);

    // Cerrar modal
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target == productModal) {
            closeModal();
        }
    });
    document.getElementById('cancelarBtn').addEventListener('click', closeModal);

    // Manejar el envío del formulario (Crear o Actualizar)
    productForm.addEventListener('submit', async (event) => {
        event.preventDefault();


        const id = parseInt(productIdInput.value);
        const productoData = {
            nombre: document.getElementById('nombre').value,
            precio: document.getElementById('precio').value,
            stock: parseInt(document.getElementById('stock').value),
            stock_minimo: parseInt(document.getElementById('stockMinimo').value),
            fecha: document.getElementById('fecha').value,
            categoria: document.getElementById('categoria').value,
            imagen: '../assets/placeholder.png' // Imagen por defecto
        };
        //Obtenemos imagen
        const archivo = document.getElementById('imagen').files[0];
        if (!archivo) return alert('Selecciona una imagen');

        //Le damos un nombre unico al archivo
        const nombreArchivo = `${Date.now()}_${archivo.name}`;

        //Guardamos la imagen
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('productos') // nombre del bucket
            .upload(nombreArchivo, archivo);

        if (uploadError) {
            console.error('Error al subir imagen:', uploadError.message);
            return alert('Error al subir imagen');
        }

        // Obtener URL pública
        const { data: publicUrlData } = supabase.storage
            .from('productos')
            .getPublicUrl(nombreArchivo);
        productoData.imagen = publicUrlData.publicUrl;


        if (id) { // Si hay un ID, estamos actualizando
            const index = productos.findIndex(p => p.id === id);
            productos[index] = { ...productos[index], ...productoData };
            Swal.fire('¡Actualizado!', 'El producto ha sido modificado.', 'success');
        } else { // Si no, estamos creando
            const { error: insertError } = await supabase
                .from('productos')
                .insert({
                    nombre: productoData.nombre,
                    precio: productoData.precio,
                    imagen: productoData.imagen,
                    categoria_id: productoData.categoria,
                    stock: productoData.stock,
                    stock_minimo: productoData.stock_minimo,
                    fecha_caducidad: productoData.fecha,
                    estado: 'activo',
                });
            Swal.fire('¡Guardado!', 'El nuevo producto ha sido agregado.', 'success');
        }

        renderProductos();
        closeModal();
    });

    // Manejar clics en los botones de "Editar" y "Eliminar" (Event Delegation)
    productList.addEventListener('click', async(event) => {
        const target = event.target;
        const id = parseInt(target.dataset.id);

        if (target.classList.contains('edit')) {
            openEditModal(id);
        }

        if (target.classList.contains('delete')) {
            Swal.fire({
                title: '¿Estás seguro?',
                text: "¡No podrás revertir esto!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, ¡eliminar!',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const { error } = await supabase
                        .from('productos')
                        .delete()
                        .eq('id', id);

                    if (error) {
                        console.error('Error al eliminar producto:', error.message);
                        Swal.fire('Error!', 'No se pudo eliminar el producto', 'error');
                    } else {
                        Swal.fire('¡Eliminado!', 'El producto ha sido eliminado.', 'success');
                    }
                    renderProductos();
                    Swal.fire('¡Eliminado!', 'El producto ha sido eliminado.', 'success');
                }
            });
        }
    });

    // --- INICIALIZACIÓN ---
    renderProductos(); // Cargar y mostrar productos al iniciar la página
});