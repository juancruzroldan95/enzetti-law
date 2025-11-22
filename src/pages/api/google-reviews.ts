export const GET = async () => {
  // Placeholder for real Google Places API logic

  const reviews = [
    {
      author_name: "María Rodríguez",
      rating: 5,
      text: "Excelente atención. Me ayudaron con mi accidente laboral y cobré mucho más de lo que esperaba. Muy recomendables.",
      time: "hace 2 semanas"
    },
    {
      author_name: "Juan Carlos Gomez",
      rating: 5,
      text: "Profesionales serios. Siempre me mantuvieron informado sobre mi caso contra la ART.",
      time: "hace 1 mes"
    },
    {
      author_name: "Esteban D.",
      rating: 4,
      text: "Muy buena predisposición para explicar todo. El trámite demoró un poco pero el resultado fue positivo.",
      time: "hace 3 meses"
    }
  ];

  return new Response(
    JSON.stringify({
      reviews: reviews,
      total_reviews: 128,
      average_rating: 4.8
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};
