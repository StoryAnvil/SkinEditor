/*
  Copyright (C) 2025, StoryAnvil (https://github.com/StoryAnvil)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see <https://www.gnu.org/licenses/>.
*/
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import WebGL from "three/addons/capabilities/WebGL.js";

const $elem = (e) => document.getElementById(e);

const $st = new (class StoryAnvilUtils {
    // Global utils for the skin editor

    #gltfLoader = new GLTFLoader();

    async loadModel(url) {
        // Loads gltf model by url

        return new Promise((resolve, reject) => {
            this.#gltfLoader.load(url, resolve);
        });
    }
})();
window.st = $st;

class SkinDisplay {
    // Displays player model in a canvas

    #scene = null;
    #camera = null;
    #renderer = null;
    #controls = null;
    #resources = null;
    #resizeObserver = null;
    #model = null;

    constructor(canvas) {
        // Create three.js scene and camera
        this.#resources = new Set();
        this.#scene = this.#track(new THREE.Scene());
        this.#camera = this.#track(
            new THREE.PerspectiveCamera(
                75,
                canvas.clientWidth / canvas.clientHeight,
                0.1,
                1000,
            ),
        );

        // Create three.js renderer
        this.#renderer = this.#track(new THREE.WebGLRenderer());
        this.#renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.#renderer.domElement.classList.add("threeCanvas");
        canvas.appendChild(this.#renderer.domElement);

        this.#controls = this.#track(
            new OrbitControls(this.#camera, this.#renderer.domElement),
        );
        this.#controls.target.set(0, 0, 0);
        this.#controls.update();
        // Connect this.render to the OrbitControls
        // NOTE: Arrow function is required, because otherwise render
        //       will be called as a static method.
        this.#controls.addEventListener("change", () => this.render());

        // Create ResizeObserver to look for canvas size changes
        this.#resizeObserver = new ResizeObserver((entries) => {
            this.#camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.#camera.updateProjectionMatrix();
            this.render();
        });
        this.#resizeObserver.observe(canvas);

        // Create AmbientLight
        const light = this.#track(new THREE.AmbientLight(0xffffff, 1));
        this.#scene.add(light);
        this.#camera.position.z = 2;

        this.render();
    }

    async setSkin(isSlim) {
        if (this.#model != null) {
            this.#scene.remove(this.#model);
        }
        this.#model = (
            await $st.loadModel(`./assets/${isSlim ? "slim" : "classic"}.gltf`)
        ).scene;
        this.#model.rotation.y = 3.141593;
        this.#scene.add(this.#model);
        this.render();
    }

    #track(resource) {
        // Adds three.js resource to tracking list.
        // All resources add will be disposed when SkinDisplay's
        // dispose method is called.
        if (resource.dispose) {
            this.#resources.add(resource);
        }
        return resource;
    }

    render() {
        // Rerenders this SkinDisplay
        this.#renderer.render(this.#scene, this.#camera);
    }

    dispose() {
        // Fully disposes this SkinDisplay
        this.#renderer.domElement.remove();
        for (const resource of this.#resources) {
            resource.dispose();
        }

        if (this.#model != null) {
            this.#model.dispose();
            this.#model = null;
        }

        this.#resources.clear();
        this.#resizeObserver.disconnect();
        this.#resizeObserver = null;
    }
}

function main() {
    // Check for WebGL2 support
    if (!WebGL.isWebGL2Available()) {
        const warning = WebGL.getWebGL2ErrorMessage();
        $elem("body").replaceChildren(warning);
        return;
    }

    window._display = new SkinDisplay($elem("skinViewer"));
    window._display.setSkin(false);
}
main();
