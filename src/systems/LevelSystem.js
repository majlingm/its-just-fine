import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export class LevelSystem {
  constructor(engine) {
    this.engine = engine;
    this.currentLevel = null;
    this.levelObjects = [];
  }

  async loadLevel(levelData) {
    // Clear previous level
    this.clearLevel();

    this.currentLevel = levelData;

    // Update lighting based on level settings
    if (levelData.lighting) {
      this.engine.updateLighting(levelData.lighting);
    }

    // Update ground based on level type
    if (levelData.groundType) {
      this.engine.updateGround(levelData.groundType);
    }

    // Play level music if specified
    if (levelData.music && this.engine.sound) {
      this.engine.sound.playMusic(levelData.music);
    }

    // Load all decorative objects
    for (const obj of levelData.objects) {
      await this.loadObject(obj);
    }

    // Set spawn boundaries
    this.engine.spawnBoundaries = levelData.spawnBoundaries || {
      minX: -80,
      maxX: 80,
      minZ: -80,
      maxZ: 80
    };

    return true;
  }

  async loadObject(objData) {
    try {
      const { scene: model } = await this.loadModel(objData.model);

      // Apply transformations
      model.position.set(objData.x || 0, objData.y || 0, objData.z || 0);

      let scaleValue = 1;
      if (objData.scale) {
        if (typeof objData.scale === 'number') {
          scaleValue = objData.scale;
          model.scale.set(objData.scale, objData.scale, objData.scale);
        } else {
          scaleValue = (objData.scale.x + objData.scale.y + objData.scale.z) / 3;
          model.scale.set(objData.scale.x, objData.scale.y, objData.scale.z);
        }
      }

      if (objData.rotation) {
        model.rotation.set(
          objData.rotation.x || 0,
          objData.rotation.y || 0,
          objData.rotation.z || 0
        );
      }

      // Enable shadows and ensure materials respond to lighting
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Ensure material can respond to lighting
          if (child.material) {
            // Keep original colors, just adjust material properties for better lighting response
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                // Don't override color - keep the original
                // Remove any emissive properties
                if (mat.emissive !== undefined) {
                  mat.emissive.setHex(0x000000); // Turn off emission
                  mat.emissiveIntensity = 0;
                }
                // Add some metalness and reduce roughness for reflections
                if (mat.metalness !== undefined) {
                  mat.metalness = 0.3;
                }
                if (mat.roughness !== undefined) {
                  mat.roughness = 0.6;
                }
              });
            } else {
              // Single material - keep original color
              // Remove any emissive properties
              if (child.material.emissive !== undefined) {
                child.material.emissive.setHex(0x000000); // Turn off emission
                child.material.emissiveIntensity = 0;
              }
              // Add some metalness and reduce roughness for reflections
              if (child.material.metalness !== undefined) {
                child.material.metalness = 0.3;
              }
              if (child.material.roughness !== undefined) {
                child.material.roughness = 0.6;
              }
            }
          }
        }
      });

      // Calculate bounding box for collision
      const box = new THREE.Box3().setFromObject(model);

      // Store collision data using actual bounding box
      const collisionData = {
        isCollidable: objData.collidable !== false, // Default true
        boundingBox: box
      };

      model.userData.collision = collisionData;

      this.engine.scene.add(model);
      this.levelObjects.push(model);

      return model;
    } catch (error) {
      console.error(`Failed to load object ${objData.model}:`, error);
      return null;
    }
  }

  // Get all collidable objects
  getCollidableObjects() {
    return this.levelObjects.filter(obj => obj.userData.collision?.isCollidable);
  }

  // Check collision between a point and level objects using bounding boxes
  checkCollision(x, z, entityRadius = 0.5) {
    for (const obj of this.levelObjects) {
      const collision = obj.userData.collision;
      if (!collision || !collision.isCollidable) continue;

      const box = collision.boundingBox;

      // Expand the bounding box by entity radius for circle-box collision
      const minX = box.min.x - entityRadius;
      const maxX = box.max.x + entityRadius;
      const minZ = box.min.z - entityRadius;
      const maxZ = box.max.z + entityRadius;

      // Check if point is inside expanded box
      if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) {
        // Calculate push-back vector (shortest distance out)
        const pushLeft = x - minX;
        const pushRight = maxX - x;
        const pushBack = z - minZ;
        const pushForward = maxZ - z;

        const minPush = Math.min(pushLeft, pushRight, pushBack, pushForward);

        let pushX = 0;
        let pushZ = 0;

        if (minPush === pushLeft) {
          pushX = -pushLeft;
        } else if (minPush === pushRight) {
          pushX = pushRight;
        } else if (minPush === pushBack) {
          pushZ = -pushBack;
        } else {
          pushZ = pushForward;
        }

        return {
          collided: true,
          pushX: pushX,
          pushZ: pushZ,
          object: obj
        };
      }
    }
    return { collided: false };
  }

  loadModel(modelPath) {
    return new Promise((resolve, reject) => {
      loader.load(
        modelPath,
        (gltf) => {
          resolve({
            scene: gltf.scene,
            animations: gltf.animations || []
          });
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  clearLevel() {
    // Remove all level objects from scene
    this.levelObjects.forEach(obj => {
      this.engine.scene.remove(obj);
      // Dispose of geometries and materials
      obj.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    });
    this.levelObjects = [];
  }

  cleanup() {
    this.clearLevel();
  }
}
