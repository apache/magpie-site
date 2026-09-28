export function measurePuzzles() {
  const errors=[];
  for (const flow of document.querySelectorAll('.puzzle-flow')) {
    if (!flow.checkVisibility() || flow.closest('[inert],[aria-hidden=true]')) continue;
    const flowStyle=getComputedStyle(flow);
    const cards=[...flow.children], horizontal=flowStyle.gridTemplateColumns.split(' ').length>1;
    if (flowStyle.filter==='none' || flowStyle.boxShadow!=='none') errors.push('puzzle group has no silhouette shadow');
    const bounds=cards.map(card => card.getBoundingClientRect());
    const point=(i,key) => {
      const s=getComputedStyle(cards[i]),r=bounds[i],fraction=parseFloat(s.getPropertyValue(key));
      return horizontal ? r.top+r.height*fraction : r.left+r.width*fraction;
    };
    const radius=parseFloat(getComputedStyle(flow).getPropertyValue('--puzzle-radius'));
    for (let i=0;i<cards.length-1;i++) {
      const a=bounds[i],b=bounds[i+1];
      if (Math.abs(point(i,'--puzzle-out')-point(i+1,'--puzzle-in'))>1) errors.push('puzzle connections do not meet');
      const gap=horizontal?b.left-a.right:b.top-a.bottom;
      if (Math.abs(gap)>.5) errors.push('puzzle pieces leave an open seam');
      if (horizontal && (Math.abs(a.top-b.top)>1 || Math.abs(a.bottom-b.bottom)>1)) errors.push('puzzle edges have unequal height');
      if (!horizontal && (Math.abs(a.left-b.left)>1 || Math.abs(a.right-b.right)>1)) errors.push('puzzle edges have unequal width');
    }
    if (cards.length===3 && Math.abs(point(0,'--puzzle-out')-point(2,'--puzzle-in')) < radius*2) errors.push('outside pieces fit without Magpie');
    for (const card of cards) {
      const s=getComputedStyle(card),paint=getComputedStyle(card,'::before');
      if ((paint.maskImage.match(/radial-gradient/g)||[]).length<3 || !paint.maskComposite.startsWith('intersect, intersect')) errors.push('missing multi-sided puzzle silhouette');
      if (s.filter!=='none' || s.boxShadow!=='none') errors.push('puzzle pieces cast shadows on one another');
    }
  }
  return errors;
}
