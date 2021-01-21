const cerrarRespuesta = () => {
    const respuesta = document.querySelector('.respuesta');
    respuesta.remove();
};

const imprimirRespuesta = () => {
    window.print();
};

const imprimirPDF = (e) => {
    console.log(e.target)
    const nombrePDF = e.target.dataset.hash;
    let contenido = document.createElement('div');
    let texto = document.createElement('h4');
    texto.innerHTML = '<h4 class="text-center">INFORMACIÓN DEL DOCUMENTO</h4><hr>';
    const documentoVer = document.querySelector('#documento-ver');
    documentoVer.style.display = 'none';
    contenido.appendChild(texto);
    contenido.appendChild(document.querySelector('#respuesta-info').cloneNode(true));
    if (contenido !== '') {
        documentoVer.style.display = 'block';
    }
    html2pdf()
        .set({
            margin: 1,
            filename: nombrePDF,
            image: {
                type: 'jpeg',
                quality: 1
            },
            html2canvas: {
                scale: 3,
                lleterRendering: true
            },
            jsPDF: {
                unit: 'in',
                format: 'a4',
                orientation: 'portrait'
            }
        })
        .from(contenido)
        .save()
        .catch();
}

const validarDatosVacios = (e) => {
    const id = document.querySelector('#id').value;
    const password = document.querySelector('#password').value;
    if (id === '' || password === '') {
        e.preventDefault();
        Swal.fire({
            icon: 'warning',
            title: 'Atencion!',
            text: 'Ambos campos son obligatorios',
        })
        return;
    }
}

/****************************************************************** */

// Cerrar respuesta
if (document.querySelector('#btnCerrarRespuesta')) {
    document.querySelector('#btnCerrarRespuesta').addEventListener('click', cerrarRespuesta);
    if (document.querySelector('.sk-circle ')) {
        document.querySelector('.sk-circle ').classList.add('oculto');
    }
}
// Imprimir respuesta
if (document.querySelector('#btnImprimirRespuesta')) {
    document.querySelector('#btnImprimirRespuesta').addEventListener('click', imprimirRespuesta);
}

// Mostrar Spinner
if (document.querySelector('.dropFileForm')) {
    document.querySelector('.dropFileForm').addEventListener('submit', () => {
        document.querySelector('.sk-circle ').classList.remove('oculto');
    });
}

// Verifica que el input no esta vacio
const verificarInputVacio = (e) => {
    var fileInput = document.querySelector('input[type="file"]');
    var file = fileInput.files.item(0);
    if (file === null) {
        e.preventDefault();
        Swal.fire({
            icon: 'warning',
            title: 'Atencion!',
            text: 'Seleccione o arrastre un documento para registrar',
        })
        document.querySelector('.sk-circle ').classList.add('oculto');
        return;
    } else {
        document.querySelector('#sendHashButton').setAttribute('disabled', true);
        if (document.querySelector('.respuesta')) {
            document.querySelector('.respuesta').remove();
        }
    }
}


// Limpiar alertas
const limpiarAlertas = () => {
    const alertas = document.querySelector('.alertas');
    const interval = setInterval(() => {
        if (alertas.children.length > 0) {
            alertas.removeChild(alertas.children[0])
        } else if (alertas.children.length === 0) {
            clearInterval(interval);
            alertas.remove();
        }
    }, 5000);
};


if (document.querySelector('#btnPDF')) {
    document.querySelector('#btnPDF').addEventListener('click', imprimirPDF);
}

document.addEventListener('DOMContentLoaded', () => {
    const alertas = document.querySelector('.alertas');
    const registrarForm = document.querySelector(".dropFileForm");
    const logueoForm = document.querySelector('#subscribeForm');

    // Si existen alertas las limpio
    if (alertas) {
        limpiarAlertas();
    }

    // Verifico si el input file esta vacio
    if (registrarForm) {
        registrarForm.addEventListener('submit', verificarInputVacio);
    }

    if (logueoForm) {
        logueoForm.addEventListener('submit', validarDatosVacios);
    }

    if (document.querySelector('.respuesta') && document.querySelector('#sendHashButton')) {
        document.querySelector('#sendHashButton').removeAttribute('disabled');
    }
});