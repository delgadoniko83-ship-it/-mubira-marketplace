# MUBIRA — Marketplace colombiano de muebles

Prototipo inicial de una plataforma colombiana de muebles, decoración y diseño del hogar.

## Estado actual
- Portada adaptable a celulares y computadores.
- Navegación por categorías y catálogo de muestra.
- Buscador de productos y carrito demostrativo.
- Configuración inicial para publicación como sitio estático en Render.

## Ejecutar
Abre `index.html` en un navegador. Esta etapa no requiere dependencias ni servidor backend.

## Publicar en Render
El archivo `render.yaml` define un sitio estático. En Render puedes crear un Blueprint conectado a este repositorio y revisar el servicio `mubira-prototipo` antes de confirmar. Alternativamente, crea un servicio Static Site con rama `main`, comando de compilación vacío y directorio de publicación `.`.

El plan gratuito y sus límites dependen de las condiciones vigentes de Render. No se ha configurado ningún pago ni dominio personalizado.

## Aviso
Los productos, descripciones y precios son ficticios. No representan inventario ni ofertas reales. El carrito es demostrativo: no recibe pagos ni crea pedidos.

## Próximas etapas
1. Validar la marca MUBIRA en Colombia.
2. Incorporar catálogo real autorizado por el cliente.
3. Crear backend, base de datos y panel administrativo.
4. Añadir vendedores, inventario y pedidos.
5. Integrar pagos y logística cuando exista presupuesto y autorización.
6. Preparar módulos futuros de video, visualización 3D y showroom virtual.

## Tecnologías
HTML, CSS y JavaScript sin dependencias de servidor.

## Estudio 360° — primera versión funcional
- Acceso desde el botón **Crear vista 360°** en la sección Colección.
- Solicita permiso de cámara desde el navegador (requiere HTTPS y permiso del usuario).
- Captura hasta 24 fotografías durante un recorrido alrededor del mueble.
- Permite girar la secuencia con el dedo o el ratón.
- Guarda las capturas en IndexedDB del navegador del dispositivo.

### Límites de esta primera versión
- La captura es una secuencia de fotografías 360°, no un modelo 3D volumétrico ni realidad aumentada.
- Las capturas se guardan únicamente en el navegador y dispositivo donde se hicieron; no se publican en el catálogo ni se sincronizan en la nube.
- Borrar los datos del navegador puede borrar las capturas. Para publicar productos reales y compartirlos con todos los visitantes hará falta una API, almacenamiento compartido y panel administrativo; no se ha contratado ni configurado ningún servicio de pago.
- La cámara solo se activa después de que el usuario pulse el botón y conceda permiso.
