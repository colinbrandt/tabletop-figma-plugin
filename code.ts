figma.showUI(__html__, { width: 300, height: 550 });

// Assume this variable tracks the state of the toggle from the UI
let selectedObjectsOnTop = true;

// Handle notifications so that new ones overwrite old ones, avoiding long notification queues
let notification: NotificationHandler | null = null;

function showNotification(message: string) {
  if (notification) {
    notification.cancel(); // Clear the previous notification
  }
  notification = figma.notify(message);
}

// Every time a selection changes, run this code
figma.on('selectionchange', async () => {
  const selectedNodes = figma.currentPage.selection.filter(node => node.type === 'GROUP' || node.type === 'FRAME' || node.type === 'INSTANCE');
  figma.ui.postMessage({ type: 'update-selection-count', count: selectedNodes.length });

  updateButtonStatus(); // Call the function to update the button status when selection changes
  
  // Only bring to top if the toggle is on
  if (selectedObjectsOnTop && selectedNodes.length > 0) {
    const selectedInstances = selectedNodes.filter(node => node.type === 'GROUP' || node.type === 'FRAME' || node.type === 'INSTANCE');
    
    if (selectedInstances.length > 0) {
      bringToTop(selectedInstances);
    }
  }

  if (selectedNodes.length === 1) {
    figma.ui.postMessage({ type: 'loading-card' });
    console.log('Sent "loading-card" message');
    const instance = selectedNodes[0];
    const previewData = await generatePreviewData(instance);
    figma.ui.postMessage({ type: 'preview-card', data: previewData });
    console.log('Sent "preview-card" message with data');
  } else {
    figma.ui.postMessage({ type: 'preview-card', data: null });
    console.log('Sent "preview-card" message with null data');
  }
});

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'update-bring-to-top-toggle') {
    updateSelectedObjectsOnTopState(msg.value);  // Update toggle state based on UI
  }

  if (msg.type === 'randomize-order') {
    const selectedNodes = figma.currentPage.selection;
    if (selectedNodes.length > 0) {
      const parent = selectedNodes[0].parent;
      if (parent) {
        const shuffledNodes = shuffleArray(selectedNodes);
        shuffledNodes.forEach(node => parent.appendChild(node));
        showNotification('Objects shuffled');
      } else {
        showNotification('Selected layers do not have a common parent.');
      }
    } else {
      showNotification('Please select some layers.');
    }
  }

  // Handle the toggle flip/roll button message
  if (msg.type === 'toggle-flip-card') {
    const selectedLayers = figma.currentPage.selection.filter(node => node.type === 'GROUP' || node.type === 'FRAME' || node.type === 'INSTANCE');
    
    let containsFace = true;
    selectedLayers.forEach(layer => {
      const faceLayers = (layer as FrameNode | GroupNode).findAll(n => n.name === 'Face');
      if (faceLayers.length < 2) {
        containsFace = false;
      }
    });

    if (containsFace) {
      rollFaces(selectedLayers);
      showNotification('Dice rolled');
    } else {
      selectedLayers.forEach(layer => toggleCardVisibility(layer, false));
      showNotification('Cards flipped');
    }
  }

  if (msg.type === 'form-deck') {
    const selectedNodes = figma.currentPage.selection.filter(node => node.type === 'INSTANCE') as InstanceNode[];
    if (selectedNodes.length > 0) {
      const parent = selectedNodes[0].parent;
      if (parent) {
        const minX = Math.min(...selectedNodes.map(node => node.x));
        const avgY = selectedNodes.reduce((sum, node) => sum + node.y, 0) / selectedNodes.length;

        const shuffledNodes = shuffleArray(selectedNodes);

        let currentY = Math.min(...shuffledNodes.map(node => node.y)); // Start from the lowest Y position

        shuffledNodes.forEach((node, index) => {
          if (node.type === 'INSTANCE') {
            node.x = minX;
            node.y = currentY - index; // Stagger each subsequent layer by 1 px
            node.setPluginData('Flip card?', 'false');
            toggleCardVisibility(node, false);
            parent.appendChild(node);
          }
        });

        showNotification('Objects stacked and shuffled');
      } else {
        showNotification('Selected objects do not have the same parent');
      }
    } else {
      showNotification('Please select some objects');
    }
  }

  if (msg.type === 'expand-deck') {
    const selectedInstances = figma.currentPage.selection.filter(node => node.type === 'INSTANCE') as InstanceNode[];
    if (selectedInstances.length > 0) {
      let currentX = selectedInstances[0].x;
      let currentY = selectedInstances[0].y;

      selectedInstances.forEach(instance => {
        // Flip the card to show the Front
        toggleCardVisibility(instance, false);

        // Position the card relative to its original position
        instance.x = currentX;
        currentX += instance.width + 16;
        instance.y = currentY;
      });

      showNotification('Objects expanded');
    } else {
      showNotification('Please select some objects');
    }
  }
};

const updateButtonStatus = () => {
  const selectedLayers = figma.currentPage.selection.filter(node => node.type === 'GROUP' || node.type === 'FRAME' || node.type === 'INSTANCE');

  if (selectedLayers.length === 0) {
    figma.ui.postMessage({ type: 'disable-flip-button' });
    return;
  }

  let containsFrontBack = false;
  let containsFace = true; // Assume true, we'll check further below
  selectedLayers.forEach(layer => {
    const frontLayer = (layer as FrameNode | GroupNode).findChild(n => n.name === 'Front');
    const backLayer = (layer as FrameNode | GroupNode).findChild(n => n.name === 'Back');
    const faceLayers = (layer as FrameNode | GroupNode).findAll(n => n.name === 'Face');

    if (frontLayer && backLayer) {
      containsFrontBack = true;
    }
    if (faceLayers.length < 2) {
      containsFace = false;
    }
  });

  // Update UI button text based on whether "Face" or "Front/Back" layers are present
  if (containsFace) {
    figma.ui.postMessage({ type: 'enable-roll-button' });
  } else if (containsFrontBack) {
    figma.ui.postMessage({ type: 'enable-flip-button' });
  } else {
    figma.ui.postMessage({ type: 'disable-flip-button' });
  }
};

function rollFaces(layers: SceneNode[]) {
  layers.forEach(layer => {
    const faceLayers = (layer as FrameNode | GroupNode).children.filter(n => n.name.startsWith('Face'));
    if (faceLayers.length > 0) {
      // Randomly pick a "Face" layer to show
      const randomIndex = Math.floor(Math.random() * faceLayers.length);
      faceLayers.forEach((face, index) => {
        face.visible = index === randomIndex; // Show the selected face, hide the others
      });

      // Update the preview in the plugin UI for the current layer
      generatePreviewData(layer); // This function updates the UI preview
    }
  });
}

function shuffleArray(array: readonly SceneNode[]): readonly SceneNode[] {
  const arrayCopy = [...array];
  for (let i = arrayCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
  }
  return arrayCopy;
}

function toggleCardVisibility(layer: SceneNode, showFront: boolean) {
  const frontLayer = (layer as FrameNode | GroupNode).findChild(n => n.name === 'Front');
  const backLayer = (layer as FrameNode | GroupNode).findChild(n => n.name === 'Back');

  if (frontLayer && backLayer) {
    if (showFront) {
      frontLayer.visible = true;
      backLayer.visible = false;
    } else {
      frontLayer.visible = false;
      backLayer.visible = true;
    }
  }
}

// Function to update the toggle state from the UI
function updateSelectedObjectsOnTopState(newState: boolean) {
  selectedObjectsOnTop = newState;
}

function bringToTop(instances: SceneNode[]) {
  // Sort selected layers by their current index in the parent's children array
  const sortedInstances = instances.slice().sort((a, b) => {
    const parent = a.parent;
    if (parent === null) return 0;
    return parent.children.indexOf(a) - parent.children.indexOf(b);
  });

  // Move each layer to the top, starting from the lowest one
  for (const instance of sortedInstances) {
    if (instance.parent) {
      instance.parent.appendChild(instance);
    }
  }
}

async function generatePreviewData(layer: SceneNode): Promise<string> {
  try {
    const previewLayer = (layer as FrameNode | GroupNode).findChild(n => n.name === 'Preview') as RectangleNode | null;

    if (previewLayer && previewLayer.type === "RECTANGLE") {
      // Ensure 'fills' is an array
      if (Array.isArray(previewLayer.fills)) {
        const fills = previewLayer.fills;
        if (fills.length > 0) {
          const imageFill = fills[0];
          // Check if the fill is of type 'IMAGE' and has an imageHash
          if (imageFill.type === "IMAGE" && imageFill.imageHash) {
            const image = figma.getImageByHash(imageFill.imageHash);
            // Ensure 'image' is not null
            if (image) {
              const imageBytes = await image.getBytesAsync();
              const base64String = "data:image/png;base64," + figma.base64Encode(imageBytes);
              return `<img src="${base64String}" alt="Preview" style="max-width: 100%; max-height: 100%;" />`;
            } else {
              console.error("Image not found for imageHash:", imageFill.imageHash);
            }
          }
        }
      } else {
        console.error("Preview layer fills is not an array");
      }
    }

    // Fall back to generating SVG preview if no valid image is found
    const clone = layer.clone();
    const front = (layer as FrameNode | GroupNode).findChild(n => n.name === 'Front');
    const back = (layer as FrameNode | GroupNode).findChild(n => n.name === 'Back');

    if (front && back) {
      front.visible = true;
      back.visible = false;
    }

    const svgString = await clone.exportAsync({ format: 'SVG_STRING' });
    clone.remove();
    return svgString;

  } catch (error) {
    console.error("Error generating preview data:", error);
    showNotification("Error generating preview data");
    return '';
  }
}