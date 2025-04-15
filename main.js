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
let slim = false;
let object;
let controls;
const loader = new GLTFLoader();
const loaderBitmap = new THREE.ImageBitmapLoader();
const searchParams = new URLSearchParams(window.location.search);
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
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
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
const addLayerRendering = (images) => {
  if (images.length == 0) return;
  loaderBitmap.load(
    images[0].id,
    (image) => {
      skinTempBuffer.clearRect(0, 0, 64, 64);
      skinTempBuffer.drawImage(image, 0, 0, 64, 64);
      for (let x = 0; x < 64; x++) {
        for (let y = 0; y < 64; y++) {
          const data = skinTempBuffer.getImageData(x, y, 1, 1);
          if (data.data[3] == 0) continue;
          if (
            images[0].hasOwnProperty("recolor") &&
            images[0].recolor.hasOwnProperty(
              `${data.data[0]}${data.data[1]}${data.data[2]}`
            )
          ) {
            const newColor =
              images[0].recolor[
                `${data.data[0]}${data.data[1]}${data.data[2]}`
              ];
            skinBuffer.fillStyle = newColor;
            skinBuffer.fillRect(x, y, 1, 1);
          } else {
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

setInterval(() => {
  if (window.storyanvil.logic.needsUpdate) {
    window.storyanvil.logic.rebuild();
    window.storyanvil.logic.needsUpdate = false;
  }
}, 250);

// Object to encapsulate logic from 3d stuff
window.storyanvil = {};
window.storyanvil.logic = {
  layers: [],
  needsUpdate: false,
  addLayer: (name) => {
    window.storyanvil.logic.layers.push({ id: name });
    addLayerRendering([{ id: name }]);
  },
  setColored: (name, color, newColor) => {
    const index = window.storyanvil.logic.layers.findIndex((m) => {
      return m.id == name;
    });

    if (index == -1) {
      let c = {};
      c[`${color}`] = newColor;
      window.storyanvil.logic.layers.push({
        id: name,
        recolor: c,
      });
      addLayerRendering([{ id: name, recolor: {} }]);
    } else {
      let c = window.storyanvil.logic.layers[index].recolor;
      c[color] = newColor;
      window.storyanvil.logic.layers[index] = {
        id: name,
        recolor: c,
      };
      window.storyanvil.logic.needsUpdate = true;
    }
  },
  putSkin: (username, type) => {
    document.getElementById("skinSelector").style.display = "none";
    document.getElementById("skinImport").style.display = "none";
    loader.load(
      type == "slim"
        ? `./templates/model/slim.gltf`
        : `./templates/model/wide.gltf`,
      function (gltf) {
        object = gltf.scene;
        scene.add(object);
        setskin(`https://mineskin.eu/skin/${username}`, type ? "wide" : "slim");
      },
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      console.error
    );
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
      window.storyanvil.logic.layers.findIndex((m) => {
        return m.id == name;
      }),
      1
    );
    window.storyanvil.logic.rebuild();
  },
  toggle: (name) => {
    if (
      window.storyanvil.logic.layers.findIndex((m) => {
        return m.id == name;
      }) == -1
    ) {
      window.storyanvil.logic.addLayer(name);
      return true;
    } else {
      window.storyanvil.logic.removeLayer(name);
      return false;
    }
  },
  onclick: (name, variant, element) => {
    if (!supportCheck(library[name].support)) return;

    if (
      window.storyanvil.logic.toggle(
        `templates/${slim ? "slim" : "wide"}/${name}${variant}.png`
      )
    ) {
      element.classList.add("active");
    } else {
      element.classList.remove("active");
    }
  },
  export: () => {
    var link = document.createElement("a");
    link.download = "skin.png";
    link.href = skinBufferCanvas.toDataURL();
    link.click();
  },
  selectSkin: (id, type) => {
    if (id == "load_skin") {
      document.getElementById("skinSelector").style.display = "none";
      document.getElementById("skinImport").style.display = "block";
      return;
    }
    document.getElementById("skinSelector").style.display = "none";
    loader.load(
      type == "slim"
        ? `./templates/model/slim.gltf`
        : `./templates/model/wide.gltf`,
      function (gltf) {
        object = gltf.scene;
        scene.add(object);
        setskin(`./templates/base/${id}.png`);
      },
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      console.error
    );
  },
  toggleHTML: (id, d) => {
    const element = document.getElementById(id);
    if (element.style.display == "none") {
      element.style.display = d;
    } else {
      element.style.display = "none";
    }
  },
};

const supportCheck = (tag) => tag === "*" || tag === (slim ? "slim" : "wide");
(() => {
  const skinModal = document.getElementById("skinSlide");
  library.base.forEach((base) => {
    skinModal.innerHTML += `
    <div onclick="window.storyanvil.logic.selectSkin('${base[0]}', '${base[1]}');" class="e">
      <img src="templates/base/${base[0]}_preview.png" title="${base[0]}_preview">
      <div class="badge badge-red">${base[1]}</div>
    </div>`;
  });
})();
(() => {
  const collectionElement = {
    Head: document.getElementById("collectionHead"),
    Hands: document.getElementById("collectionHands"),
    Body: document.getElementById("collectionBody"),
    Pants: document.getElementById("collectionPants"),
    Feet: document.getElementById("collectionFeet"),
    Ears: document.getElementById("collectionEars"),
    Eyes: document.getElementById("collectionEyes"),
  };
  const card = (id, v, item, b) => {
    const m = () => {
      if (item.variants.length == 0) return "";
      let html = ``;
      item.variants.forEach((variant) => {
        html += card(
          `${id}`,
          variant,
          {
            name: item.name,
            category: item.category,
            support: item.support,
            variants: [],
          },
          false
        );
      });
      return html;
    };
    const c = b
      ? `const l = document.getElementById('library_variants_${id}');l.style.display=l.style.display=='none'?'flex':'none';`
      : `window.storyanvil.logic.onclick('${id}', '${v}', this)`;
    return `
      <div class="card${
        supportCheck(item.support) ? "" : " unsupported"
      }" onclick="${c}">
        <img title="${item.name}" src="templates/preview/${id}${v}.png">
        <div id="library_variants_${id}${v}" class="cardVariants" style="display: none; z-index: 500; position: relative; top: -110%, left: 0%; width: fit-content; outline: 5px solid green; flex-direction: column">
          ${m()}
        </div>
      </div>
    `;
  };
  library.all.forEach((id) => {
    const item = library[id];

    if (item.recolor) {
      let colorEditors = "";
      item.recolor.forEach((color) => {
        colorEditors += `
        <input type="color" id="colorVariant_${id}_${
          color[0] + color[1] + color[2]
        }" value="${rgbToHex(
          color[0],
          color[1],
          color[2]
        )}" oninput="window.storyanvil.logic.setColored(\`templates/${
          slim ? "slim" : "wide"
        }/${id}.png\`, \`${color[0]}${color[1]}${color[2]}\`, this.value);">
        `;
      });

      collectionElement[item.category].innerHTML += `
      <div class="card" onclick="const l = document.getElementById('library_variants_${id}');l.style.display=l.style.display=='none'?'flex':'none';">
        <img title="${item.name}" src="templates/preview/${id}.png">
        <div id="library_variants_${id}" class="cardVariants" style="display: none; z-index: 500; position: relative; top: -110%, left: 0%; width: fit-content; outline: 5px solid green; flex-direction: column">
          ${colorEditors}
          <button onclick="window.storyanvil.logic.removeLayer('cat')">Remove</button>
        </div>
      </div>
      `;
    } else {
      if (item.variants.length == 0) {
        collectionElement[item.category].innerHTML += `
        <div class="card${
          supportCheck(item.support) ? "" : " unsupported"
        }" onclick="window.storyanvil.logic.onclick('${id}', '', this)">
          <img title="${item.name}" src="templates/preview/${id}.png">
        </div>
      `;
      } else {
        collectionElement[item.category].innerHTML += card(id, "", item, true);
      }
    }
  });
})();
