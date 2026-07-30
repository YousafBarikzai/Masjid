/* Mosque-themed photography for the site's image slots.

   These fill every placeholder with a relevant, tasteful photo (generated for
   KMA — no identifiable people; scenes are photographed from behind or are
   people-free). They are the DEFAULT layer only: uploading a real photo to
   /public/images/<slot>.jpg always wins (see ImageSlot), so the mosque can
   replace any of these with real photography at any time, no code change. */

const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3ExMRBrS0MIIBYJxGYEM9uzQhbQ";

export const REMOTE_IMAGES: Record<string, string> = {
  // About
  "about-mosque": `${CDN}/hf_20260730_094531_9095d0ac-5801-494b-a850-45a113c1f7cd_min.webp`,
  // Services
  "congregational-prayers": `${CDN}/hf_20260730_095854_f61230c1-1864-4933-8255-e8677f656a71_min.webp`,
  "madrasah": `${CDN}/hf_20260730_094948_fd573b98-ba6b-4261-8568-dacb265b061e_min.webp`,
  "sisters-circles": `${CDN}/hf_20260730_095002_85507df5-3dde-41cd-b9a4-b7ccce08a066_min.webp`,
  "marriage": `${CDN}/hf_20260730_095015_0566219e-9227-401e-b99c-76ae21a437de_min.webp`,
  "school-visits": `${CDN}/hf_20260730_095026_d257e896-31ea-4304-8903-bc8cc184c0fc_min.webp`,
  "funeral": `${CDN}/hf_20260730_095051_721bcf28-f3ce-49af-84e4-0de05db50d00_min.webp`,
  "youth-1": `${CDN}/hf_20260730_095904_be4c2b8c-cba0-411e-ac80-fef7da045a54_min.webp`,
  "youth-2": `${CDN}/hf_20260730_095107_744ce318-5713-49d5-b43e-20f720424acb_min.webp`,
  "youth-3": `${CDN}/hf_20260730_095913_e9e3c9c7-626c-4dc5-9b45-b2818c53412f_min.webp`,
  // News fallback cards
  "news-eid": `${CDN}/hf_20260730_095241_fef1e3d7-cbb0-473a-a707-8c29e66ecac9_min.webp`,
  "news-ramadan": `${CDN}/hf_20260730_095249_559ea89c-c188-43df-9c73-f771e1c92350_min.webp`,
  "news-madrasah": `${CDN}/hf_20260730_095257_e09fac2d-573b-4738-85aa-4eb8bc594b4e_min.webp`,
  "news-agm": `${CDN}/hf_20260730_095312_2dfb1348-9854-4bd4-97df-d0d3fda90941_min.webp`,
  "news-community": `${CDN}/hf_20260730_095417_09730a81-9ede-44ca-9ae3-222487c6cf21_min.webp`,
  // Media library thumbnails
  "media-khutbah-1": `${CDN}/hf_20260730_095429_3bf497dc-572b-4be3-9e43-32019bd803d8_min.webp`,
  "media-khutbah-2": `${CDN}/hf_20260730_095438_5f244061-e7ed-441f-9fd3-f3b27062fc52_min.webp`,
  "media-quran-1": `${CDN}/hf_20260730_095446_e7bb27ab-6c68-475c-90e4-8fb510edace2_min.webp`,
  "media-quran-2": `${CDN}/hf_20260730_095546_ef03b5b6-4394-4481-9c5c-cae3496de3b4_min.webp`,
  "media-lecture-1": `${CDN}/hf_20260730_095603_10d39d32-6997-44ff-9878-b4adf47f23f4_min.webp`,
  "media-lecture-2": `${CDN}/hf_20260730_095611_56594d69-3780-49bc-a7f3-e5824e4bada0_min.webp`,
};
