// InputBox component — handles PDB file upload (drag & drop + click)
const InputBox = {
    selectedFile: null,

    init() {
        const dropzone = document.getElementById('upload-box');
        const fileInput = document.getElementById('pdb-file-input');
        const btn = document.getElementById('discover-btn');

        // Click to browse
        dropzone.addEventListener('click', () => fileInput.click());

        // File selected via browse dialog
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.setFile(e.target.files[0]);
            }
        });

        // Drag & drop events
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });
        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
        });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                if (file.name.toLowerCase().endsWith('.pdb')) {
                    this.setFile(file);
                } else {
                    alert('Please upload a .pdb file');
                }
            }
        });

        // Discover button
        btn.addEventListener('click', () => this.submit());
    },

    setFile(file) {
        this.selectedFile = file;

        // Show file info
        document.getElementById('file-name').textContent = file.name;
        const btn = document.getElementById('discover-btn');
        btn.innerHTML = 'Analyze Protein';
        btn.disabled = false;
    },

    clearFile() {
        this.selectedFile = null;
        const fileInput = document.getElementById('pdb-file-input');
        document.getElementById('file-name').textContent = '';
        const btn = document.getElementById('discover-btn');
        btn.innerHTML = 'Analyze Protein';
        btn.disabled = true;
        fileInput.value = '';
    },

    submit() {
        if (!this.selectedFile) return;
        App.runDiscovery(this.selectedFile);
    },

    setLoading(loading) {
        const btn = document.getElementById('discover-btn');
        btn.disabled = loading;
        btn.innerHTML = loading ? 'Processing...' : 'Analyze Protein';
    }
};
