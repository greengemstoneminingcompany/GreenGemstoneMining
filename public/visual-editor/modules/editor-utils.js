export function createElementPath(root) {
  return (el) => {
    if (!el) return '';
    if (el.dataset.veBlockId) return '[data-ve-block-id="'+el.dataset.veBlockId+'"]';
    if (el.id) return '#'+el.id.replace(/([^\w-])/g,'\\$1');
    const parts = []; let node = el;
    while (node && node.nodeType === 1 && node !== root && node !== document.body) {
      let n=1, sib=node; while ((sib=sib.previousElementSibling)) if (sib.tagName===node.tagName) n++;
      parts.unshift(node.tagName.toLowerCase()+':nth-of-type('+n+')'); node=node.parentElement;
      if (node && node.id) { parts.unshift('#'+node.id.replace(/([^\w-])/g,'\\$1')); break; }
    }
    return parts.join(' > ');
  };
}

export async function compressImage(file){
    if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG, or WebP image.');
    const bitmap=await createImageBitmap(file),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('This browser cannot prepare the image.');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.78));if(!blob||blob.size>1_100_000)throw Error('This image is still too large after compression. Choose a smaller image.');
    return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Could not read this image.'));reader.readAsDataURL(blob);});
  }
