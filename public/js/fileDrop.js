var dropFileForm = document.querySelector(".dropFileForm");
var fileLabelText = document.getElementById("fileLabelText");
var uploadStatus = document.getElementById("uploadStatus");
var fileInput = document.getElementById("fileInput");
var droppedFiles;
var documentName;

function overrideDefault(event) {
    event.preventDefault();
    event.stopPropagation();
}

function fileHover() {
    dropFileForm.classList.add("fileHover");
}

function fileHoverEnd() {
    dropFileForm.classList.remove("fileHover");
}


function addFiles(event) {
    droppedFiles = event.target.files || event.dataTransfer.files;
    if (droppedFiles.length != 0) {
        if (droppedFiles[0].size > 20000000) {
            Swal.fire({
                icon: 'warning',
                title: 'Tamaño de documento superado',
                text: 'El documento no debe superar los 20MB',
            })
            droppedFiles = '';
            fileLabelText.innerText = "Seleccione o arrastre un documento aquí";
            return;
        } else if (document.getElementById(firmante).value === '') {
            Swal.fire({
                icon: 'warning',
                title: 'Debe elegir un firmante',
                text: 'El documento debe tener un firmante',
            })
            droppedFiles = '';
            fileLabelText.innerText = "Seleccione o arrastre un documento aquí";
            return;
        }
        if (droppedFiles[0].type !== 'application/pdf') {
            Swal.fire({
                icon: 'warning',
                title: 'Atencion!',
                text: 'Solo se admiten documentos en formato .pdf',
            })
            droppedFiles = '';
            fileLabelText.innerText = "Seleccione o arrastre un documento aquí";
            return;
        }
        showFiles(droppedFiles);
        if (showFiles(droppedFiles) === -1) {
            return droppedFiles = '';
        }
        fileInput.files = droppedFiles;
        documentName = fileInput.files[0].name;
    } else fileLabelText.innerText = "Seleccione o arrastre un documento aquí";
}

function showFiles(files) {
    if (files.length > 1) {
        Swal.fire({
            icon: 'warning',
            title: 'Máximo de documentos superado',
            text: 'Solo se puede registrar un documento a la vez',
        })
        fileLabelText.innerText = "Seleccione o arrastre un documento aquí";
        return -1;
    } else {
        fileLabelText.innerText = files[0].name;
    }
}


function filePreview() {
    var fileInput = document.querySelector('input[type="file"]');
    var file = fileInput.files.item(0);
    var reader = new FileReader();
    if (file != null) {
        reader.readAsDataURL(file);
    }
}

function filePreview2(input) {
    var reader = new FileReader();
    reader.readAsDataURL(input.files[0]);
}

$('#fileInput').change(function() {
    filePreview(this);
});