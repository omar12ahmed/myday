import { exploreAssets, licenceUrls, type AssetId } from './assets';
export function ReferenceImage({ asset, className = '', priority = false }: { asset: AssetId; className?: string; priority?: boolean }) {
  const image = exploreAssets[asset];
  return <figure className={`ex-reference-image ${className}`} data-asset={asset}>
    <img src={image.src} width={image.width} height={image.height} alt={image.alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" />
    <figcaption>{image.caption}
      {/* The credit each licence asks for: author, source, licence and what was changed. */}
      <span className="ex-credit">Photo: <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer">{image.creator}, via {image.source}</a> · <a href={licenceUrls[image.licence]} target="_blank" rel="noopener noreferrer">{image.licence}</a> · {image.changes}</span>
    </figcaption>
  </figure>;
}
