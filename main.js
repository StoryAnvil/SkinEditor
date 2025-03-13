import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { library } from "./library.js";

const skinBufferCanvas = document.getElementById("skinBuffer");
const skinBuffer = skinBufferCanvas.getContext("2d", {
  willReadFrequently: true,
});
const skinTempBufferCanvas = document.getElementById("skinTempBuffer");
const skinTempBuffer = skinTempBufferCanvas.getContext("2d", {
  willReadFrequently: true,
});
const orignialSkinBufferCanvas = document.getElementById("originalSkinBuffer");
const originalSkinBuffer = orignialSkinBufferCanvas.getContext("2d", {
  willReadFrequently: true,
});
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const invisible = skinBuffer.createImageData(1, 1);
let object;
let controls;
const loader = new GLTFLoader();
const loaderBitmap = new THREE.ImageBitmapLoader();
loader.load(
  `./model.gltf`,
  function (gltf) {
    object = gltf.scene;
    scene.add(object);
    setskin("./default.png");
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  console.error
);
const renderer = new THREE.WebGLRenderer({ alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("body").appendChild(renderer.domElement);
camera.position.z = -3.5;
camera.rotation.x = 180;
const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(500, 500, 500);
topLight.castShadow = true;
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
controls = new OrbitControls(camera, renderer.domElement);
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

const setskin = (l) => {
  loaderBitmap.load(
    l,
    (image) => {
      originalSkinBuffer.clearRect(0, 0, 64, 64);
      skinBuffer.clearRect(0, 0, 64, 64);
      originalSkinBuffer.drawImage(image, 0, 0, 64, 64);
      for (let x = 0; x < 64; x++) {
        for (let y = 0; y < 64; y++) {
          const data = originalSkinBuffer.getImageData(x, y, 1, 1);
          if (
            data.data[0] == 255 &&
            data.data[1] == 255 &&
            data.data[2] == 255 &&
            data.data[3] == 255
          ) {
            skinBuffer.fillStyle =
              "rgba(" + 250 + "," + 250 + "," + 250 + "," + 255 / 255 + ")";
            skinBuffer.fillRect(x, y, 1, 1);
          } else if (data.data[3] == 255) {
            skinBuffer.putImageData(data, x, y);
          }
        }
      }
      render();
    },
    undefined,
    console.error
  );
};
document.getElementById("setskin").onclick = () => {
  const username = prompt("Enter your minecraft username:");
  setskin("https://mineskin.eu/skin/" + username);
};

const addLayerRendering = (images) => {
  if (images.length == 0) return;
  loaderBitmap.load(
    images[0],
    (image) => {
      skinTempBuffer.clearRect(0, 0, 64, 64);
      skinTempBuffer.drawImage(image, 0, 0, 64, 64);
      for (let x = 0; x < 64; x++) {
        for (let y = 0; y < 64; y++) {
          const data = skinTempBuffer.getImageData(x, y, 1, 1);
          if (
            data.data[0] == 255 &&
            data.data[1] == 255 &&
            data.data[2] == 255 &&
            data.data[3] == 255
          ) {
            //skinBuffer.putImageData(invisible, x, y);
            skinBuffer.putImageData(data, x, y);
          } else if (data.data[3] == 255) {
            skinBuffer.putImageData(data, x, y);
          }
        }
      }
      if (images.length == 1) {
        render();
        return;
      }
      addLayerRendering(images.slice(1));
    },
    undefined,
    console.error
  );
};

function render() {
  scene.children[2].children[0].traverse((c) => {
    if (c.material) {
      createImageBitmap(skinBufferCanvas, 0, 0, 64, 64).then((img) => {
        c.material.map.image = img;
        c.material.map.needsUpdate = true;
        c.material.needsUpdate = true;
      });
    }
  });
}

// Object to encapsulate logic from 3d stuff
window.storyanvil = {};
window.storyanvil.logic = {
  layers: [],
  addLayer: (name) => {
    window.storyanvil.logic.layers.push(name);
    addLayerRendering([name]);
  },
  rebuild: () => {
    skinBuffer.clearRect(0, 0, 64, 64);
    createImageBitmap(orignialSkinBufferCanvas, 0, 0, 64, 64).then(
      (originalSkin) => {
        skinBuffer.drawImage(originalSkin, 0, 0, 64, 64);
        addLayerRendering(window.storyanvil.logic.layers);
        if (window.storyanvil.logic.layers.length == 0) {
          render();
        }
      }
    );
  },
  removeLayer: (name) => {
    window.storyanvil.logic.layers.splice(
      window.storyanvil.logic.layers.indexOf(name),
      1
    );
    window.storyanvil.logic.rebuild();
  },
  toggle: (name) => {
    if (window.storyanvil.logic.layers.indexOf(name) == -1) {
      window.storyanvil.logic.addLayer(name);
    } else {
      window.storyanvil.logic.removeLayer(name);
    }
  },
  export: () => {
    var link = document.createElement("a");
    link.download = "skin.png";
    link.href = skinBufferCanvas.toDataURL();
    link.click();
  },
};

const collectionElement = document.getElementById("collection");
(() => {
  let html = ``;
  library.forEach((item) => {
    html += `
    <div class="card" onclick="window.storyanvil.logic.toggle('./templates/${item.id}.png')">
      <img title="${item.name}" src="templates/${item.id}_.png">
    </div>
    `;
  });
  collectionElement.innerHTML = html;
})();
