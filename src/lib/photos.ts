// Landing photography: free-licence Unsplash photos of Nigerian sellers, buyers and markets, credited in the footer.
// Swap any entry for the team's own photo of a real seller; keep the credit shape.
export type Photo = { id: string; alt: string; by: string; user: string; place?: string; w: number; h: number };

const u = (id: string, w: number) => `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;

export const photos = {
  excited: { id: "1677935708583-d044791164cf", alt: "A young woman gasps happily at her phone screen", by: "Ahmed Nasiru", user: "ahmed_nasiru", w: 1200, h: 1600 },
  showing: { id: "1739289671654-facdf104dbd0", alt: "A buyer shows a seller something on his phone", by: "Ninthgrid", user: "ninthgrid_", w: 1600, h: 1067 },
  corps: { id: "1761370980969-a803951cf104", alt: "A young woman in white and green checks her phone on an Abuja street", by: "Muhammad-Taha Ibrahim", user: "planeteelevene", place: "Abuja", w: 1200, h: 1500 },
  striped: { id: "1635742488368-0465153c32d6", alt: "A young man in a striped shirt smiles at his phone", by: "Desola Lanre-Ologun", user: "desola", w: 1600, h: 1067 },
  hand: { id: "1576814547952-f8531781d7ef", alt: "A hand in ankara holds a phone over a laptop", by: "Olumide Bamgbelu", user: "brandbymide", w: 1600, h: 1067 },
  market: { id: "1649502913092-fb7f0e8fc632", alt: "A crowded Lagos market street seen from above", by: "Namnso Ukpanah", user: "namnsoukpanah", place: "Lagos", w: 1200, h: 1800 },
  bananas: { id: "1722072391426-964abfef1924", alt: "A woman sells bananas on an Ibadan street", by: "Tunde Buremo", user: "tundeburemo", place: "Ibadan", w: 1600, h: 1067 },
  headscarf: { id: "1761370980657-22586ea44093", alt: "A woman in a red headscarf smiles at her market stall", by: "Muhammad-Taha Ibrahim", user: "planeteelevene", place: "Abuja", w: 1200, h: 1500 },
  stall: { id: "1761370980688-8438b7220d0b", alt: "A young woman in a red headscarf at a market stall", by: "Muhammad-Taha Ibrahim", user: "planeteelevene", place: "Abuja", w: 1200, h: 1500 },
  tomatoes: { id: "1734255026082-82fdc81991f0", alt: "Traders around a table of tomatoes at Bodija market", by: "Tunde Buremo", user: "tundeburemo", place: "Ibadan", w: 1600, h: 1067 },
  fruit: { id: "1577116730797-5d99b71d3946", alt: "Avocados and oranges in a market basket", by: "Ima Enoch", user: "ima_ayo", w: 1600, h: 1200 },
} satisfies Record<string, Photo>;

export const src = (p: Photo, w = 1200) => u(p.id, w);
export const credits = Object.values(photos).filter((p, i, a) => a.findIndex((q) => q.user === p.user) === i);
