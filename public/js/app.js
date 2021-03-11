const cerrarRespuesta = () => {
    const respuesta = document.querySelector('.respuesta');
    respuesta.remove();
};

const imprimirRespuesta = () => {
    const documentoVer = document.querySelector('#documento-ver');
    documentoVer.style.display = 'none';
    window.print();
    documentoVer.style.display = 'block';
};

const imprimirPDF = async(e) => {
    const hashDocOriginal = document.querySelector('#hash-documento').textContent;
    const parrafoDocumento = document.querySelector('#parrafo-info');
    const imagenQR = document.querySelector('#imagen-qr');
    let tamanioHoja;
    /* inputOptions can be an object or Promise */

    const inputOptions = new Promise((resolve) => {
        resolve({
            '#ff0000': 'A3',
            '#00ff00': 'A4',
        })
    })

    const { value: tamanio } = await Swal.fire({
        title: 'Seleccione un tamaño de hoja',
        input: 'radio',
        showCancelButton: true,
        confirmButtonText: `Aceptar`,
        cancelButtonText: 'Cancelar',
        cancelButtonColor: '#6c757d',
        confirmButtonColor: '#6c757d',
        inputOptions: inputOptions,
        inputValidator: (value) => {
            if (!value) {
                return 'Por favor seleccione un tamaño de hoja'
            }
        }
    })

    if (tamanio === undefined) {
        return;
    }

    if (tamanio === '#ff0000') {
        tamanioHoja = 'A3';
        parrafoDocumento.style.setProperty('margin-left', '400px');
    } else {
        tamanioHoja = 'A4';
    }

    if (!parrafoDocumento) {
        return Swal.fire({
            icon: 'error',
            title: 'Atencion!',
            text: 'No existe un documento para generar el PDF',
        });
    }
    e.target.setAttribute('disabled', 'true');
    document.querySelector('#sk-circle-pdf').classList.remove('oculto');
    document.querySelector('#texto-spinner-pdf').classList.remove('oculto');
    parrafoDocumento.style.setProperty('margin-bottom', '0px');
    imagenQR.style.setProperty('margin-bottom', '0px');
    imagenQR.style.setProperty('width', '80px');


    const informacion = document.querySelector('#respuesta-info').cloneNode(true);


    if (tamanioHoja === 'A3') {
        parrafoDocumento.style.setProperty('margin-left', '0px');
    }
    /* 
        parrafoDocumento.style.setProperty('margin-bottom', '1 rem');
        imagenQR.style.setProperty('width', '100px'); */

    let contenido = document.createElement('div');
    contenido.style.setProperty('padding', '40px');
    contenido.style.setProperty('font-size', '11px');
    contenido.style.setProperty('text-align', 'justify');
    contenido.style.setProperty('margin-top', '812px');
    contenido.style.setProperty('margin-bottom', '0px');
    contenido.appendChild(informacion);
    fetch('/generar-pdf', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contenido: contenido.outerHTML, hashDocOriginal: hashDocOriginal + '.pdf', tamanioHoja })
        })
        .then(respuesta => respuesta.json())
        .then(resultado => {
            e.target.removeAttribute('disabled');
            document.querySelector('#sk-circle-pdf').classList.add('oculto');
            document.querySelector('#texto-spinner-pdf ').classList.add('oculto');
            if (resultado.error) {

                return Swal.fire({
                    icon: 'error',
                    title: 'Atencion!',
                    text: resultado.error,
                });
            }
            window.open(resultado.url, 'Download');
        })
        .catch(error => console.log(error))
};

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