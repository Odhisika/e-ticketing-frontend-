export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  price: number;
  image: string;
  location: string;
  organizer: string;
}

export const mockEvents: Event[] = [
  {
    id: "1",
    title: "Koforidua Music & Culture Festival 2025",
    description:
      "Celebrate Ghanaian music, dance, and culture with performances from top local and national artists. Enjoy live highlife, afrobeat, gospel, and traditional drumming under the stars. Expect food vendors, cultural displays, and a night to remember!",
    date: "2025-09-15T18:00:00Z",
    price: 50.0,
    image:
      "https://images.unsplash.com/photo-1555375771-14b4d4d4d5b5?w=800&h=600&fit=crop",
    location: "Koforidua Youth Resource Centre",
    organizer: "Eastern Region Arts Council",
  },
  {
    id: "2",
    title: "Tech & Innovation Fair - Koforidua 2025",
    description:
      "Explore the future of technology in Ghana! Meet local innovators, see live demos in AI, mobile apps, and renewable energy. Network with entrepreneurs and attend workshops led by industry experts.",
    date: "2025-10-05T09:00:00Z",
    price: 100.0,
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
    location: "Koforidua Youth Resource Centre",
    organizer: "Ghana Tech Hub",
  },
  {
    id: "3",
    title: "Eastern Region Food & Drinks Festival",
    description:
      "Taste the best of Ghanaian cuisine from kelewele to banku and tilapia. Enjoy fresh palm wine, fruit smoothies, and local drinks while watching cooking demonstrations from top chefs.",
    date: "2025-11-20T12:00:00Z",
    price: 30.0,
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop",
    location: "Koforidua Youth Resource Centre",
    organizer: "Eastern Region Tourism Board",
  },
  {
    id: "4",
    title: "Art & Photography Exhibition - Koforidua",
    description:
      "An inspiring display of artworks, photography, and crafts by talented artists from the Eastern Region. Meet the creators, enjoy live painting sessions, and purchase unique pieces.",
    date: "2025-08-25T10:00:00Z",
    price: 20.0,
    image:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
    location: "Koforidua Youth Resource Centre",
    organizer: "Eastern Region Art Collective",
  },
  {
    id: "5",
    title: "Koforidua Marathon 2025",
    description:
      "Join runners from across Ghana for the annual Koforidua Marathon. Multiple race categories including 42km, 21km, and a 5km fun run. Registration includes race kits, T-shirts, and medals for finishers.",
    date: "2025-12-01T06:00:00Z",
    price: 40.0,
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    location: "Koforidua Youth Resource Centre",
    organizer: "Eastern Region Sports Authority",
  },
  {
    id: "6",
    title: "Comedy Night - Koforidua Edition",
    description:
      "Enjoy an evening of non-stop laughter with Ghana's top comedians. Live stand-up, music, and great food. This special edition promises a relaxed and fun atmosphere for all.",
    date: "2025-09-30T19:30:00Z",
    price: 25.0,
    image:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop",
    location: "Koforidua Youth Resource Centre",
    organizer: "Laugh Factory Ghana",
  },
];
