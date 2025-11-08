class FileHandler {
    constructor() {
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = [
            'image/jpeg',
            'image/png',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
    }

    async uploadFile(file, type, referenceId) {
        if (!this.validateFile(file)) {
            return false;
        }

        try {
            const filePath = `${type}/${referenceId}/${file.name}`;
            const { data, error } = await supabase.storage
                .from('attachments')
                .upload(filePath, file);

            if (error) throw error;

            const { data: attachment, error: attachmentError } = await supabase
                .from('attachments')
                .insert([{
                    file_path: filePath,
                    file_name: file.name,
                    file_type: file.type,
                    file_size: file.size,
                    reference_type: type,
                    reference_id: referenceId
                }]);

            if (attachmentError) throw attachmentError;

            Toast.show('File uploaded successfully!', 'success');
            return data.path;
        } catch (error) {
            console.error('Error uploading file:', error);
            Toast.show('Failed to upload file', 'error');
            return false;
        }
    }

    validateFile(file) {
        if (file.size > this.maxFileSize) {
            Toast.show('File size exceeds 5MB limit', 'error');
            return false;
        }

        if (!this.allowedTypes.includes(file.type)) {
            Toast.show('File type not allowed', 'error');
            return false;
        }

        return true;
    }

    async getFiles(type, referenceId) {
        try {
            const { data, error } = await supabase
                .from('attachments')
                .select('*')
                .eq('reference_type', type)
                .eq('reference_id', referenceId);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching files:', error);
            return [];
        }
    }

    async deleteFile(filePath) {
        try {
            const { error: storageError } = await supabase.storage
                .from('attachments')
                .remove([filePath]);

            if (storageError) throw storageError;

            const { error: dbError } = await supabase
                .from('attachments')
                .delete()
                .eq('file_path', filePath);

            if (dbError) throw dbError;

            Toast.show('File deleted successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            Toast.show('Failed to delete file', 'error');
            return false;
        }
    }

    createFileUploader(container, type, referenceId, onUpload) {
        const uploader = document.createElement('div');
        uploader.className = 'file-uploader';
        uploader.innerHTML = `
            <div class="upload-area" id="uploadArea">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Drag & Drop files here or click to select</p>
                <input type="file" id="fileInput" style="display: none;">
            </div>
            <div class="file-list" id="fileList"></div>
        `;

        container.appendChild(uploader);

        const fileInput = uploader.querySelector('#fileInput');
        const uploadArea = uploader.querySelector('#uploadArea');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            for (const file of files) {
                const path = await this.uploadFile(file, type, referenceId);
                if (path && onUpload) onUpload(path);
            }
        });

        fileInput.addEventListener('change', async () => {
            const files = fileInput.files;
            for (const file of files) {
                const path = await this.uploadFile(file, type, referenceId);
                if (path && onUpload) onUpload(path);
            }
        });

        this.refreshFileList(uploader.querySelector('#fileList'), type, referenceId);
    }

    async refreshFileList(container, type, referenceId) {
        const files = await this.getFiles(type, referenceId);
        container.innerHTML = files.map(file => `
            <div class="file-item">
                <i class="fas fa-file"></i>
                <span class="file-name">${file.file_name}</span>
                <div class="file-actions">
                    <button class="download-btn" data-path="${file.file_path}">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="delete-btn" data-path="${file.file_path}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners for download and delete buttons
        container.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', () => this.downloadFile(btn.dataset.path));
        });

        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this file?')) {
                    this.deleteFile(btn.dataset.path);
                    this.refreshFileList(container, type, referenceId);
                }
            });
        });
    }

    async downloadFile(path) {
        try {
            const { data, error } = await supabase.storage
                .from('attachments')
                .download(path);

            if (error) throw error;

            // Create download link
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = path.split('/').pop();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            Toast.show('Failed to download file', 'error');
        }
    }
}