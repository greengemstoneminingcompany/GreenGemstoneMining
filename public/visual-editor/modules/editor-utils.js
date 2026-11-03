export function createElementPath(root) {
  return (el) => {
    if (!el) return '';
    if (el.dataset.veBlockId) return '[data-ve-block-id="'+el.dataset.veBlockId+'"]';
    if (/^[a-z0-9.-]{1,120}$/i.test(el.dataset.editorId || '')) return '[data-editor-id="'+el.dataset.editorId+'"]';
    if (el.id) return '#'+CSS.escape(el.id);
    // Prefer stable semantic selectors when they uniquely identify the element.
    for (const attr of ['data-testid','data-section','aria-label']) {
      const value=el.getAttribute(attr);
      if(value && value.length<=120 && /^[a-z0-9 _.-]+$/i.test(value)) {
        const selector=el.tagName.toLowerCase()+'['+attr+'="'+value+'"]';
        try { if(root.querySelectorAll(selector).length===1) return selector; } catch {}
      }
    }
    const classes=[...el.classList].filter(name=>/^[a-z][a-z0-9_-]{1,60}$/i.test(name)&&!/^ve-|^reveal$|^in$/.test(name));
    for(const name of classes.slice(0,3)) {
      const selector=el.tagName.toLowerCase()+'.'+name;
      try { if(root.querySelectorAll(selector).length===1) return selector; } catch {}
    }
    const parts = []; let node = el;
    while (node && node.nodeType === 1 && node !== root && node !== document.body) {
      let n=1, sib=node; while ((sib=sib.previousElementSibling)) if (sib.tagName===node.tagName) n++;
      parts.unshift(node.tagName.toLowerCase()+':nth-of-type('+n+')'); node=node.parentElement;
      if (node && node.id) { parts.unshift('#'+CSS.escape(node.id)); break; }
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
