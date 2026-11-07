// Approved illustrative root covers. URLs can point at a public CDN when it is connected.
export const rootGalleryCovers: Readonly<Record<string, readonly string[]>> = {
  "Minerals": [
    "/assets/gallery-covers/minerals-cover-01.jpg"
  ],
  "Agriculture": [
    "/assets/gallery-covers/agriculture-cover-01.jpg",
    "/assets/gallery-covers/agriculture-cover-02.jpg",
    "/assets/gallery-covers/agriculture-cover-03.jpg",
    "/assets/gallery-covers/agriculture-cover-04.jpg"
  ],
  "Livestock": [
    "/assets/gallery-covers/livestock-cover-01.jpg"
  ],
  "Fisheries": [
    "/assets/gallery-covers/fisheries-cover-01.jpg"
  ],
  "Seaweed & Aquaculture": [
    "/assets/gallery-covers/seaweed-aquaculture-cover-01.jpg",
    "/assets/gallery-covers/seaweed-aquaculture-cover-02.jpg",
    "/assets/gallery-covers/seaweed-aquaculture-cover-03.jpg"
  ],
  "Company & Corporate": [
    "/assets/gallery-covers/company-corporate-cover-01.jpg",
    "/assets/gallery-covers/company-corporate-cover-02.jpg",
    "/assets/gallery-covers/company-corporate-cover-03.jpg"
  ],
  "Media & Communications": [
    "/assets/gallery-covers/media-communications-cover-01.jpg",
    "/assets/gallery-covers/media-communications-cover-02.jpg",
    "/assets/gallery-covers/media-communications-cover-03.jpg",
    "/assets/gallery-covers/media-communications-cover-04.jpg",
    "/assets/gallery-covers/media-communications-cover-05.jpg",
    "/assets/gallery-covers/media-communications-cover-06.jpg",
    "/assets/gallery-covers/media-communications-cover-07.jpg",
    "/assets/gallery-covers/media-communications-cover-08.jpg"
  ]
};
const key='ggmc-gallery-root-visit';
export function beginRootCoverVisit(fallback:number):number {
  try {
    const stored=Number(sessionStorage.getItem(key));
    const visit=Number.isSafeInteger(stored)&&stored>=0?stored:fallback;
    sessionStorage.setItem(key,String(visit===Number.MAX_SAFE_INTEGER?0:visit+1));
    return visit;
  } catch {return fallback;}
}
