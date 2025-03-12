import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let object;
let controls;
const loader = new GLTFLoader();
const loaderBitmap = new THREE.ImageBitmapLoader();
loader.load(
  `./model.gltf`,
  function (gltf) {
    object = gltf.scene;
    scene.add(object);
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  console.error
);
const renderer = new THREE.WebGLRenderer({ alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("body").appendChild(renderer.domElement);
camera.position.z = 3.5;
const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(500, 500, 500);
topLight.castShadow = true;
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0x333333, 5);
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

document.onmousemove = (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
};

animate();

const skinBufferCanvas = document.getElementById("skinBuffer");
const skinBuffer = skinBufferCanvas.getContext("2d", {
  willReadFrequently: true,
});

const skinTempBufferCanvas = document.getElementById("skinTempBuffer");
const skinTempBuffer = skinTempBufferCanvas.getContext("2d", {
  willReadFrequently: true,
});

document.getElementById("setskin").onclick = () => {
  const username = prompt();
  loaderBitmap.load(
    "https://mineskin.eu/skin/" + username,
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

const invisible = skinBuffer.createImageData(1, 1);

const loadImage = (image) => {
  loaderBitmap.load(
    image,
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
            skinBuffer.putImageData(invisible, x, y);
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

const save = () => {
  var link = document.createElement("a");
  link.download = "skin.png";
  link.href = skinBufferCanvas.toDataURL();
  link.click();
};

document.getElementById("set").onclick = () => {
  loadImage(document.getElementById("post").value);
};
document.getElementById("export").onclick = () => {
  save();
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
