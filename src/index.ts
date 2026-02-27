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
import "./style.css";
import SLIM_MODEL from "./models/slim.gltf";
import CLASSIC_MODEL from "./models/classic.gltf";
import TestSkin from "./9f4420391882124f.png";
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {GLTFLoader, GLTF} from "three/addons/loaders/GLTFLoader.js";
import WebGL from "three/addons/capabilities/WebGL.js";
import {StLoadedAccessory} from "./accessory";
import {StMenuBar} from "./ui";

class AsyncAssetLoader {
    // Class for managing asset loading using async methods.

    #gltfLoader = new GLTFLoader();
    #textureLoader = new THREE.TextureLoader();

    async loadModel(url: string): Promise<GLTF> {
        // Loads gltf model by url

        return new Promise((resolve, reject) => {
            this.#gltfLoader.load(url, resolve);
        });
    }

    async loadTexture(url: string): Promise<THREE.Texture<HTMLImageElement>> {
        // Loads texture by url

        return new Promise((resolve, reject) => {
            this.#textureLoader.load(url, resolve);
        });
    }

    async loadExternalAccessory(url: string): Promise<StLoadedAccessory> {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then((resp) => resp.json())
                .then((json) => resolve(new StLoadedAccessory(json)))
                .catch(reject);
        });
    }
}

class SkinDisplay {
    // Displays player model in a canvas

    #scene: THREE.Scene = null;
    #camera: THREE.PerspectiveCamera = null;
    #renderer: THREE.WebGLRenderer = null;
    #controls: OrbitControls = null;
    #resources: Set<any> = null;
    #resizeObserver: ResizeObserver = null;
    #model: any = null;

    constructor(parent: HTMLElement) {
        // Create THREE.JS scene and camera
        this.#resources = new Set();
        this.#scene = this.#track(new THREE.Scene());
        this.#camera = this.#track(
            new THREE.PerspectiveCamera(
                75,
                parent.clientWidth / parent.clientHeight,
                0.1,
                1000,
            ),
        );

        // Create three.js renderer
        this.#renderer = this.#track(new THREE.WebGLRenderer());
        this.#renderer.setSize(parent.clientWidth, parent.clientHeight);
        parent.classList.add("threeCanvasParent");
        this.#renderer.domElement.classList.add("threeCanvas");
        parent.appendChild(this.#renderer.domElement);

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
            this.#renderer.domElement.style.width = parent.clientWidth + "px";
            this.#renderer.domElement.style.height = parent.clientHeight + "px";
            this.#renderer.setSize(
                parent.clientWidth,
                parent.clientHeight,
                false,
            );
            this.#camera.aspect = parent.clientWidth / parent.clientHeight;
            this.#camera.updateProjectionMatrix();
            this.render();
        });
        this.#resizeObserver.observe(parent);

        // Create AmbientLight
        const light = this.#track(new THREE.AmbientLight(0xffffff, 2.5));
        this.#scene.add(light);
        this.#camera.position.z = 2;

        this.render();
    }

    async setSkin(isSlim: boolean, skin: string | HTMLCanvasElement) {
        // Updates skin of this Skin Display
        if (this.#model != null) {
            this.#scene.remove(this.#model);
        }
        this.#model = (
            await $st.loadModel(isSlim ? SLIM_MODEL : CLASSIC_MODEL)
        ).scene;
        this.#model.rotation.y = 3.141593 /* radians */;
        this.#scene.add(this.#model);

        let texture = null;
        if (typeof skin === "string") {
            texture = await $st.loadTexture(skin);
        } else {
            texture = new THREE.CanvasTexture(skin);
        }

        if (this.#model == null) return;
        this.#model.traverse((c: any) => {
            if (!c.material) return;
            const old = c.material.map.source;
            if (old.dispose) old.dispose();
            c.material.map.source = texture.source;
            c.material.map.needsUpdate = true;
            c.material.needsUpdate = true;
        });

        this.render();
    }

    #track<T>(resource: T): T {
        // Adds three.js resource to tracking list.
        // All resources add will be disposed when SkinDisplay's
        // dispose method is called.
        if (resource.hasOwnProperty("dispose")) {
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

const $st = new AsyncAssetLoader();

function setupUI() {
    // Create MenuBar
    const menuBar = new StMenuBar();
    document.body.appendChild(menuBar.domElement);

    const fileMenu = menuBar.createMenu("File");
    const helpMenu = menuBar.createMenu("Help");
    fileMenu.addOption("Export", () => {});
    helpMenu.addLink("GitHub Repo", "https://github.com/StoryAnvil/SkinEditor");
    helpMenu.addLink(
        "Report Bugs",
        "https://github.com/StoryAnvil/SkinEditor/issues",
    );
}

async function main() {
    // Check for WebGL2 support
    if (!WebGL.isWebGL2Available()) {
        const warning = WebGL.getWebGL2ErrorMessage();
        document.body.replaceChildren(warning);
        return;
    }

    setupUI();

    const skinViewer = document.createElement("div");
    skinViewer.id = "skinViewer";
    skinViewer.style.width = "100vw";
    skinViewer.style.height = "100vh";
    document.body.appendChild(skinViewer);

    //#region TEST
    const canvasElement = document.createElement("canvas");
    canvasElement.width = 64;
    canvasElement.height = 64;
    canvasElement.style.position = "absolute";
    canvasElement.style.right = "0px";
    canvasElement.style.top = "0px";
    canvasElement.style.width = "128px";
    canvasElement.style.height = "128px";
    canvasElement.style.zIndex = "1000";
    const canvas = canvasElement.getContext("2d");
    const image = document.createElement("img");
    image.src = TestSkin;

    await new Promise((resolve, reject) => {
        image.addEventListener("load", resolve);
    });
    canvas.drawImage(image, 0, 0);
    document.body.appendChild(canvasElement);
    //#endregion

    const typelessWindow: any = window;
    typelessWindow._display = new SkinDisplay(skinViewer);
    typelessWindow._display.setSkin(true, canvasElement);

    //#region TEST
    const accessory = new StLoadedAccessory(require("./accessories/cat.json"));
    console.log(accessory);
    //accessory.render(canvas);
    //#endregion
}
main();
