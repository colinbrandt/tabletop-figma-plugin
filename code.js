(()=>{"use strict";({168:function(){var e=this&&this.__awaiter||function(e,t,i,n){return new(i||(i=Promise))((function(a,o){function s(e){try{r(n.next(e))}catch(e){o(e)}}function l(e){try{r(n.throw(e))}catch(e){o(e)}}function r(e){var t;e.done?a(e.value):(t=e.value,t instanceof i?t:new i((function(e){e(t)}))).then(s,l)}r((n=n.apply(e,t||[])).next())}))};figma.showUI(__html__,{width:300,height:550});let t=!0,i=null;function n(e){i&&i.cancel(),i=figma.notify(e)}figma.on("selectionchange",(()=>e(void 0,void 0,void 0,(function*(){const e=figma.currentPage.selection.filter((e=>"GROUP"===e.type||"FRAME"===e.type||"INSTANCE"===e.type));if(figma.ui.postMessage({type:"update-selection-count",count:e.length}),a(),t&&e.length>0){const t=e.filter((e=>"GROUP"===e.type||"FRAME"===e.type||"INSTANCE"===e.type));t.length>0&&function(e){const t=e.slice().sort(((e,t)=>{const i=e.parent;return null===i?0:i.children.indexOf(e)-i.children.indexOf(t)}));for(const e of t)e.parent&&e.parent.appendChild(e)}(t)}if(1===e.length){figma.ui.postMessage({type:"loading-card"}),console.log('Sent "loading-card" message');const t=e[0],i=yield l(t);figma.ui.postMessage({type:"preview-card",data:i}),console.log('Sent "preview-card" message with data')}else figma.ui.postMessage({type:"preview-card",data:null}),console.log('Sent "preview-card" message with null data')})))),figma.ui.onmessage=i=>e(void 0,void 0,void 0,(function*(){var a;if("update-bring-to-top-toggle"===i.type&&(a=i.value,t=a),"randomize-order"===i.type){const e=figma.currentPage.selection;if(e.length>0){const t=e[0].parent;t?(o(e).forEach((e=>t.appendChild(e))),n("Objects shuffled")):n("Selected layers do not have a common parent.")}else n("Please select some layers.")}if("toggle-flip-card"===i.type){const t=figma.currentPage.selection.filter((e=>"GROUP"===e.type||"FRAME"===e.type||"INSTANCE"===e.type));let i=!0;t.forEach((e=>{e.findAll((e=>"Face"===e.name)).length<2&&(i=!1)})),i?(function(t){e(this,void 0,void 0,(function*(){if(t.forEach((e=>{const t=e.children.filter((e=>e.name.startsWith("Face")));if(t.length>0){const e=Math.floor(Math.random()*t.length);t.forEach(((t,i)=>{t.visible=i===e}))}})),1===t.length){figma.ui.postMessage({type:"loading-card"}),console.log('Sent "loading-card" message');const e=t[0],i=yield l(e);figma.ui.postMessage({type:"preview-card",data:i}),console.log('Sent "preview-card" message with data')}else figma.ui.postMessage({type:"preview-card",data:null}),console.log('Sent "preview-card" message with null data')}))}(t),n("Dice rolled")):(t.forEach((e=>s(e,"toggle"))),n("Cards flipped"))}if("form-deck"===i.type){const e=figma.currentPage.selection.filter((e=>"INSTANCE"===e.type));if(e.length>0){const t=e[0].parent;if(t){const i=Math.min(...e.map((e=>e.x))),a=(e.reduce(((e,t)=>e+t.y),0),e.length,o(e));let l=Math.min(...a.map((e=>e.y)));a.forEach(((e,n)=>{"INSTANCE"===e.type&&(e.x=i,e.y=l-n,e.setPluginData("Flip card?","false"),s(e,"back"),t.appendChild(e))})),n("Objects stacked and shuffled")}else n("Selected objects do not have the same parent")}else n("Please select some objects")}if("expand-deck"===i.type){const e=figma.currentPage.selection.filter((e=>"INSTANCE"===e.type));if(e.length>0){let t=e[0].x,i=e[0].y;e.forEach((e=>{s(e,"front"),e.x=t,t+=e.width+16,e.y=i})),n("Objects expanded")}else n("Please select some objects")}}));const a=()=>{const e=figma.currentPage.selection.filter((e=>"GROUP"===e.type||"FRAME"===e.type||"INSTANCE"===e.type));if(0===e.length)return void figma.ui.postMessage({type:"disable-flip-button"});let t=!1,i=!0;e.forEach((e=>{const n=e.findChild((e=>"Front"===e.name)),a=e.findChild((e=>"Back"===e.name)),o=e.findAll((e=>"Face"===e.name));n&&a&&(t=!0),o.length<2&&(i=!1)})),i?figma.ui.postMessage({type:"enable-roll-button"}):t?figma.ui.postMessage({type:"enable-flip-button"}):figma.ui.postMessage({type:"disable-flip-button"})};function o(e){const t=[...e];for(let e=t.length-1;e>0;e--){const i=Math.floor(Math.random()*(e+1));[t[e],t[i]]=[t[i],t[e]]}return t}function s(e,t){const i=e.findChild((e=>"Front"===e.name)),n=e.findChild((e=>"Back"===e.name));i&&n&&("front"===t?(i.visible=!0,n.visible=!1):"back"===t?(i.visible=!1,n.visible=!0):"toggle"===t&&(!0===i.visible?(i.visible=!1,n.visible=!0):(i.visible=!0,n.visible=!1)))}function l(t){return e(this,void 0,void 0,(function*(){try{const e=t.findChild((e=>"Preview"===e.name));if(e&&"RECTANGLE"===e.type)if(Array.isArray(e.fills)){const t=e.fills;if(t.length>0){const e=t[0];if("IMAGE"===e.type&&e.imageHash){const t=figma.getImageByHash(e.imageHash);if(t){const e=yield t.getBytesAsync();return`<img src="${"data:image/png;base64,"+figma.base64Encode(e)}" alt="Preview" style="max-width: 100%; max-height: 100%;" />`}console.error("Image not found for imageHash:",e.imageHash)}}}else console.error("Preview layer fills is not an array");const i=t.clone(),n=i.findChild((e=>"Front"===e.name)),a=i.findChild((e=>"Back"===e.name));n&&a&&(n.visible=!0,a.visible=!1);const o=yield i.exportAsync({format:"SVG_STRING"});return i.remove(),o}catch(e){return console.error("Error generating preview data:",e),n("Error generating preview data"),""}}))}}})[168]()})();