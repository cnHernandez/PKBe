  // Recuperar los productos del carrito del localStorage
  const cartItems = JSON.parse(localStorage.getItem('cartItems')) || {};

  
  function mostrarCarrito() {
    const cartContainer = document.getElementById('cart-container');
    cartContainer.innerHTML = '';

    let totalGeneral = 0;

    // Verifica los productos en el carrito
    console.log("Items del carrito:", cartItems);

    if (Object.keys(cartItems).length === 0) {
        cartContainer.innerHTML = '<p class="vacio-carrito">Ohh noo está vacío, volve atrás y llenalo!!</p>';
        document.getElementById('total').textContent = '0.00';
        document.getElementById('checkout-button').style.display = 'none';
        return;
    }

    // Crear y mostrar las tarjetas de producto
    for (const productId in cartItems) {
        const producto = cartItems[productId];
        const total = (producto.precio * producto.cantidad).toFixed(2);
        totalGeneral += producto.precio * producto.cantidad;

        const productoCard = `
             <div class="col-md-4">
                <div class="card mb-4">
                    <img src="${producto.imagen}" class="card-img-top" alt="${producto.nombre}">
                    <div class="card-body">
                        <h5 class="card-title">${producto.nombre}</h5>
                        <p class="card-text"> ${producto.tipo}</p> <!-- Mostrar tipo -->
                        <p class="card-text">Cantidad: ${producto.cantidad}</p>
                        <p class="card-text">Precio unitario: $${producto.precio.toFixed(2)}</p>
                        <p class="card-text">Total: $${total}</p>
                        <button class="btn btn-danger" onclick="eliminarProducto(${productId})">Eliminar</button>
                    </div>
                </div>
            </div>
        `;
        cartContainer.innerHTML += productoCard;
    }

    // Actualiza el total general
    document.getElementById('total').textContent = totalGeneral.toFixed(2);

    // Mostrar el botón de pago
    const checkoutButton = document.getElementById('checkout-button');
    checkoutButton.style.display = 'block';

    // Configurar el evento de clic para el botón de pago
    checkoutButton.onclick = () => {

        if (!validarFormularioEnvio()) {

            alert("Completa el Formulario correctamente para continuar con el pago...");
            return; // Si la validación falla, no continuar
        }
       // Desactivar temporalmente el evento beforeunload
       window.removeEventListener('beforeunload', clearCartOnClose);

        const items = Object.keys(cartItems).map(productId => {
            const producto = cartItems[productId];
            return {
                title: producto.nombre,
                quantity: producto.cantidad,
                unit_price: producto.precio
            };
        });

        // Enviar los productos al backend para crear la preferencia de pago
        fetch('http://localhost:8080/create_preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: items })
        })
        .then(response => {
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            return response.json();
        })
        .then(data => {
            console.log("Datos recibidos del servidor:", data);
            if (data.init_point) {
                realizarPago(data.init_point); // Llamar a realizarPago con la URL de Mercado Pago
            } else {
                alert('El campo init_point no está definido en la respuesta.');
            }
        })
        .catch(error => {
            console.error('Error al crear la preferencia:', error);
            alert('Hubo un problema al crear la preferencia. Intente de nuevo más tarde.');
        });
    };

    // Agregar funcionalidad al botón "Volver"
    document.getElementById('back-button').onclick = () => {
        window.location.href = 'index.html'; // Redirigir a index.html
    };

}

// Mover la función de limpiar carrito a una función separada
function clearCartOnClose() {
    localStorage.removeItem('cartItems');
}

// Asignar la función de limpiar carrito al evento beforeunload
window.addEventListener('beforeunload', clearCartOnClose);

  
function eliminarProducto(productId) {
      delete cartItems[productId];
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      mostrarCarrito();
      actualizarCantidadCarrito(); // Asegúrate de actualizar el contador en el navbar
  }


  function realizarPago(urlMercadoPago) {
    // Cambia esto por el número de WhatsApp del destinatario (incluye el código de país)
    const numeroWhatsApp = '5491124577474'; 
    let mensaje = "Detalles de mi pedido:\n";

    // Obtener los productos del carrito
    for (const productId in cartItems) {
        const producto = cartItems[productId];
        mensaje += `${producto.nombre} ${producto.tipo} - Cantidad: ${producto.cantidad} - Precio: $${(producto.precio * producto.cantidad).toFixed(2)}\n`;
    }

    // Calcular el total
    const total = Object.values(cartItems).reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    mensaje += `\nTotal: $${total.toFixed(2)}\n`;

    // Capturar datos del formulario de envío
    const calle = document.getElementById("calle").value;
    const numero = document.getElementById("numero").value;
    const entreCalles = document.getElementById("entre-calles").value;
    const localidad = document.getElementById("localidad").value;

    // Agregar datos de envío al mensaje
    mensaje += `\nDatos de envío:\n`;
    mensaje += `Calle: ${calle}\n`;
    mensaje += `Número: ${numero}\n`;
    mensaje += `Entre calles: ${entreCalles}\n`;
    mensaje += `Localidad: ${localidad}\n`;

    // Codificar el mensaje para URL
    const mensajeCodificado = encodeURIComponent(mensaje);

    // Crear la URL para abrir WhatsApp
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${mensajeCodificado}`;

    // Abrir WhatsApp en una nueva pestaña
    window.open(urlWhatsApp, '_blank');

    // Redirigir a Mercado Pago después de 2 segundos
    setTimeout(() => {
        window.location.href = urlMercadoPago; // Redirigir a la URL de Mercado Pago
    }, 5000);
 } // 10 segundos de espera

// Llama a mostrarCarrito al cargar la página para mostrar el contenido del carrito
mostrarCarrito();

function validarFormularioEnvio() {
    // Obtener los valores de los campos
    const calle = document.getElementById("calle").value.trim();
    const numero = document.getElementById("numero").value.trim();
    const entreCalles = document.getElementById("entre-calles").value.trim();
    const localidad = document.getElementById("localidad").value.trim();

    // Validar que no estén vacíos
    if (!calle) {
        alert("Por favor, ingresa la calle.");
        return false;
    }
    if (!numero) {
        alert("Por favor, ingresa el número.");
        return false;
    }
    if (!entreCalles) {
        alert("Por favor, ingresa las entre calles.");
        return false;
    }
    if (!localidad) {
        alert("Por favor, ingresa la localidad.");
        return false;
    }

    // Validar que el número solo contenga dígitos
    if (!/^\d+$/.test(numero)) {
        alert("El número debe contener solo dígitos.");
        return false;
    }

    // Si todas las validaciones pasan
    return true;
}

function handleReviewFormSubmit(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const review = document.getElementById('review').value;
    const rating = document.getElementById('rating').value;
    
    const reviewCard = document.createElement('div');
    reviewCard.className = 'col-md-4';
    reviewCard.innerHTML = `
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">${username}</h5>
                <p class="card-text">${review}</p>
                <p class="text-muted">${'⭐'.repeat(rating)}</p>
            </div>
        </div>
    `;
    
    document.getElementById('reviews-list').appendChild(reviewCard);
    
    // Limpiar el formulario
    document.getElementById('review-form').reset();
}

document.getElementById('review-form').addEventListener('submit', handleReviewFormSubmit);