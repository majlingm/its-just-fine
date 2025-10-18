/**
 * Reusable File Explorer component for browsing assets
 */
export class FileExplorer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            basePath: '../../public/assets',
            onSelect: null,
            fileTypes: ['.png', '.jpg', '.glb', '.json'],
            ...options
        };
        this.currentPath = '';
        this.files = [];
    }

    /**
     * Render the file explorer
     */
    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="file-explorer">
                <div class="explorer-header">
                    <input type="text" id="search-input" placeholder="Search assets..." />
                </div>
                <div class="explorer-tree" id="file-tree">
                    <!-- File tree will be populated here -->
                </div>
            </div>
        `;

        this.attachEventListeners();
        this.loadFileTree();
    }

    /**
     * Load the file tree structure
     */
    async loadFileTree() {
        const treeContainer = document.getElementById('file-tree');

        // For now, create a basic structure
        // In production, this would load from a manifest or API
        const structure = {
            'sprites': {
                'environment': [],
                'items': [],
                'equipment': [],
                'props': []
            },
            'textures': {
                'ground': []
            },
            'models': [],
            'data': []
        };

        this.renderTree(treeContainer, structure);
    }

    /**
     * Render the tree structure
     */
    renderTree(container, structure, path = '') {
        const ul = document.createElement('ul');
        ul.className = 'tree-list';

        for (const [key, value] of Object.entries(structure)) {
            const li = document.createElement('li');
            li.className = 'tree-item';

            if (typeof value === 'object' && !Array.isArray(value)) {
                // Folder
                li.innerHTML = `
                    <div class="tree-folder">
                        <span class="folder-icon">📁</span>
                        <span class="folder-name">${key}</span>
                    </div>
                `;
                const subTree = document.createElement('div');
                subTree.className = 'tree-children';
                this.renderTree(subTree, value, `${path}/${key}`);
                li.appendChild(subTree);
            } else {
                // File
                li.innerHTML = `
                    <div class="tree-file" data-path="${path}/${key}">
                        <span class="file-icon">📄</span>
                        <span class="file-name">${key}</span>
                    </div>
                `;
            }

            ul.appendChild(li);
        }

        container.appendChild(ul);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterFiles(e.target.value);
            });
        }

        // Delegate click events for tree items
        this.container.addEventListener('click', (e) => {
            const folder = e.target.closest('.tree-folder');
            const file = e.target.closest('.tree-file');

            if (folder) {
                this.toggleFolder(folder);
            } else if (file && this.options.onSelect) {
                this.options.onSelect(file.dataset.path);
            }
        });
    }

    /**
     * Toggle folder open/closed
     */
    toggleFolder(folder) {
        const parent = folder.parentElement;
        const children = parent.querySelector('.tree-children');
        if (children) {
            children.style.display = children.style.display === 'none' ? 'block' : 'none';
            const icon = folder.querySelector('.folder-icon');
            icon.textContent = children.style.display === 'none' ? '📁' : '📂';
        }
    }

    /**
     * Filter files by search term
     */
    filterFiles(searchTerm) {
        const files = this.container.querySelectorAll('.tree-file');
        const folders = this.container.querySelectorAll('.tree-folder');

        const term = searchTerm.toLowerCase();

        files.forEach(file => {
            const name = file.querySelector('.file-name').textContent.toLowerCase();
            const match = name.includes(term);
            file.parentElement.style.display = match || !term ? 'block' : 'none';
        });

        // Show all folders if searching
        if (term) {
            folders.forEach(folder => {
                const children = folder.parentElement.querySelector('.tree-children');
                if (children) children.style.display = 'block';
            });
        }
    }
}
