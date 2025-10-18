import { AssetLoader } from '../shared/utils/AssetLoader.js';

class AssetViewer {
    constructor() {
        this.assetLoader = new AssetLoader();
        this.currentCategory = 'sprites';
        this.currentSubcategory = null;
        this.assets = [];
        this.zoom = 100;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCategory('sprites');
    }

    setupEventListeners() {
        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.loadCategory(e.target.dataset.category);
            });
        });

        // Search
        document.getElementById('asset-search').addEventListener('input', (e) => {
            this.filterAssets(e.target.value);
        });

        // Zoom
        const zoomSlider = document.getElementById('zoom-slider');
        zoomSlider.addEventListener('input', (e) => {
            this.zoom = e.target.value;
            document.getElementById('zoom-value').textContent = `${this.zoom}%`;
            this.updateZoom();
        });

        // View mode
        document.getElementById('view-mode').addEventListener('change', (e) => {
            this.setViewMode(e.target.value);
        });

        // Close preview
        document.getElementById('close-preview').addEventListener('click', () => {
            document.getElementById('preview-panel').classList.add('hidden');
        });
    }

    async loadCategory(category) {
        this.currentCategory = category;

        // Update subcategories based on category
        const subcategories = this.getSubcategories(category);
        this.renderSubcategories(subcategories);

        // Load first subcategory by default
        if (subcategories.length > 0) {
            this.loadSubcategory(subcategories[0]);
        }
    }

    getSubcategories(category) {
        const subcategoryMap = {
            'sprites': ['environment', 'items', 'equipment', 'props'],
            'textures': ['ground'],
            'models': ['characters', 'props']
        };
        return subcategoryMap[category] || [];
    }

    renderSubcategories(subcategories) {
        const container = document.getElementById('subcategory-list');
        container.innerHTML = subcategories.map(sub => `
            <div class="subcategory-item" data-subcategory="${sub}">
                ${sub.charAt(0).toUpperCase() + sub.slice(1)}
            </div>
        `).join('');

        container.querySelectorAll('.subcategory-item').forEach(item => {
            item.addEventListener('click', (e) => {
                container.querySelectorAll('.subcategory-item').forEach(i => i.classList.remove('active'));
                e.target.classList.add('active');
                this.loadSubcategory(e.target.dataset.subcategory);
            });
        });
    }

    async loadSubcategory(subcategory) {
        this.currentSubcategory = subcategory;

        // Build the path based on category and subcategory
        const path = `${this.currentCategory}/${subcategory}`;

        // For now, we'll scan for common asset files
        // In production, this would use a manifest file
        await this.scanAssets(path);
    }

    async scanAssets(path) {
        const assetGrid = document.getElementById('asset-grid');

        // Hardcoded asset lists for demo purposes
        // In production, this would read from manifest files
        const assetFiles = this.getAssetFiles(path);

        if (assetFiles.length === 0) {
            assetGrid.innerHTML = '<div class="empty-state"><p>No assets found in this category</p></div>';
            return;
        }

        this.assets = assetFiles;
        this.renderAssets(assetFiles);
    }

    getAssetFiles(path) {
        // Demo asset list - replace with actual file scanning
        const basePath = `sprites/${this.currentSubcategory}`;

        // Common asset names based on what we generated
        const assetMap = {
            'sprites/environment': [
                'bush', 'boulder', 'dead_tree', 'flowers', 'skull_pile',
                'small_rocks', 'mushrooms', 'grass_tuft', 'wooden_crate',
                'barrel', 'torch', 'gravestone', 'crystal', 'bones_pile',
                'broken_pillar', 'spiderweb'
            ],
            'sprites/items': [
                'glowing_potion', 'health_potion', 'mana_potion', 'poison_potion',
                'key', 'lockpicks', 'torch_item', 'lantern', 'book', 'scroll',
                'map', 'gemstone', 'ring', 'amulet', 'coins', 'treasure_bag'
            ],
            'sprites/equipment': [
                'longsword', 'battle_axe', 'war_hammer', 'magic_dagger',
                'bow', 'crossbow', 'magic_staff', 'mace', 'chainmail_armor',
                'plate_armor', 'leather_armor', 'studded_armor', 'demon_shield',
                'demon_helmet', 'armored_boots', 'armored_gauntlets'
            ],
            'sprites/props': [
                'poison_mushrooms', 'blood_pool', 'broken_shield', 'rusty_sword',
                'rune_stone', 'summoning_circle', 'skeleton_corpse', 'spider_nest',
                'open_chest', 'helmet', 'gargoyle_statue', 'iron_fence',
                'wooden_door', 'stone_column', 'hanging_chains', 'brazier'
            ],
            'textures/ground': [
                'tile_brick_wall', 'tile_cracked_stone', 'tile_bloodstained',
                'tile_dirt_gravel', 'tile_mossy_stone', 'tile_rune_circle',
                'tile_dark_vortex', 'tile_bones', 'tile_lava_cracks',
                'tile_frozen_ice', 'tile_wooden_planks', 'tile_metal_grate',
                'tile_spike_trap', 'tile_toxic_slime', 'tile_corrupted_stone',
                'tile_dark_concrete'
            ]
        };

        const files = assetMap[path] || [];
        return files.map(name => ({
            name: name,
            path: `${path}/${name}.png`
        }));
    }

    renderAssets(assets) {
        const assetGrid = document.getElementById('asset-grid');

        assetGrid.innerHTML = assets.map(asset => `
            <div class="asset-item" data-asset="${asset.path}">
                <div class="asset-thumbnail">
                    <img src="../../public/assets/${asset.path}" alt="${asset.name}"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 fill=%22%23666%22>No Image</text></svg>'">
                </div>
                <div class="asset-name">${asset.name}</div>
            </div>
        `).join('');

        // Add click handlers
        assetGrid.querySelectorAll('.asset-item').forEach(item => {
            item.addEventListener('click', () => {
                this.showPreview(item.dataset.asset);
            });
        });
    }

    filterAssets(searchTerm) {
        const term = searchTerm.toLowerCase();
        const filtered = this.assets.filter(asset =>
            asset.name.toLowerCase().includes(term)
        );
        this.renderAssets(filtered);
    }

    updateZoom() {
        const items = document.querySelectorAll('.asset-thumbnail img');
        items.forEach(img => {
            img.style.transform = `scale(${this.zoom / 100})`;
        });
    }

    setViewMode(mode) {
        const grid = document.getElementById('asset-grid');
        if (mode === 'list') {
            grid.style.gridTemplateColumns = '1fr';
        } else {
            grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        }
    }

    showPreview(assetPath) {
        const previewPanel = document.getElementById('preview-panel');
        const canvas = document.getElementById('preview-canvas');
        const ctx = canvas.getContext('2d');
        const info = document.getElementById('preview-info');

        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            info.innerHTML = `
                <h4>Asset Information</h4>
                <p><strong>Path:</strong> ${assetPath}</p>
                <p><strong>Size:</strong> ${img.width} x ${img.height}</p>
                <p><strong>Type:</strong> PNG Image</p>
            `;

            previewPanel.classList.remove('hidden');
        };
        img.src = `../../public/assets/${assetPath}`;
    }
}

// Initialize the asset viewer
new AssetViewer();
