import React from 'react';

const HomePage = () => {
  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#FAF3DD', color: '#5E503F' }}>
      {/* Hero Section */}
      <section
        style={{
          backgroundColor: '#E7651',
          padding: '3rem 1rem',
          color: '#FAF3DD',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#FAF3DD' }}>Welcome to EcoFinds</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          A sustainable, customer-first e-commerce platform delivering curated products with transparency and trust. Discover something new, something better.
        </p>
        <button
          style={{
            backgroundColor: '#8E44AD',
            color: '#FAF3DD',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            marginTop: '2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Shop Now
        </button>
      </section>

      {/* Features Section */}
      <section style={{ padding: '4rem 1rem', backgroundColor: '#FAF3DD' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2rem' }}>Why EcoFinds?</h2>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: '2rem',
            maxWidth: '1000px',
            margin: '0 auto',
          }}
        >
          {[
            {
              title: 'Authentic Sellers',
              desc: 'Every seller is verified to ensure transparency and trust.',
              bg: '#A3B18A',
            },
            {
              title: 'Personalized Experience',
              desc: 'Get product suggestions based on what matters to you.',
              bg: '#8E44AD',
            },
            {
              title: 'Sustainable Choices',
              desc: 'Eco-conscious products that don’t cost the planet.',
              bg: '#E7651',
            },
          ].map((card, index) => (
            <div
              key={index}
              style={{
                backgroundColor: card.bg,
                color: '#FAF3DD',
                padding: '2rem',
                borderRadius: '12px',
                width: '280px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              }}
            >
              <h3 style={{ marginBottom: '0.5rem' }}>{card.title}</h3>
              <p>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section
        style={{
          backgroundColor: '#5E503F',
          color: '#FAF3DD',
          padding: '3rem 1rem',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          Shop Smart. Shop Sustainable. Shop EcoFinds.
        </h2>
        <button
          style={{
            backgroundColor: '#A3B18A',
            color: '#5E503F',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Explore Products
        </button>
      </section>
    </div>
  );
};

export default HomePage;