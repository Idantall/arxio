'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckIcon, XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const router = useRouter();

  const plans = [
    {
      id: 'free',
      name: 'חינם',
      price: '0₪',
      description: 'מושלם למשתמשים פרטיים וסטודנטים',
      features: [
        'עד 3 פרויקטים',
        'עד 5 בדיקות אבטחה בחודש',
        'דוחות בסיסיים',
        'תמיכה בקהילה',
      ],
      limitations: [
        'ללא בדיקות מתקדמות',
        'ללא API',
        'ללא תמיכה מקצועית',
      ],
      buttonText: 'התחל בחינם',
      buttonColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
    },
    {
      id: 'pro',
      name: 'מקצועי',
      price: '199₪',
      period: 'לחודש',
      description: 'לחברות קטנות וצוותי פיתוח',
      features: [
        'פרויקטים ללא הגבלה',
        'עד 50 בדיקות אבטחה בחודש',
        'דוחות מפורטים',
        'API גישה',
        'תמיכה מקצועית',
        'אינטגרציה עם כלי CI/CD',
      ],
      limitations: [
        'ללא בדיקות מותאמות אישית',
      ],
      buttonText: 'התחל תקופת ניסיון',
      buttonColor: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      highlighted: true,
    },
    {
      id: 'enterprise',
      name: 'ארגוני',
      price: 'בהתאמה אישית',
      description: 'לחברות גדולות וצרכים מורכבים',
      features: [
        'פרויקטים ללא הגבלה',
        'בדיקות אבטחה ללא הגבלה',
        'דוחות מותאמים אישית',
        'API גישה ללא הגבלה',
        'תמיכה VIP 24/7',
        'בדיקות אבטחה מותאמות אישית',
        'אינטגרציה מלאה',
        'הדרכות צוות',
      ],
      limitations: [],
      buttonText: 'צור קשר',
      buttonColor: 'bg-gradient-to-r from-purple-500 to-purple-600',
    }
  ];

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    
    // ניתוב בהתאם לתוכנית שנבחרה
    if (planId === 'free') {
      router.push('/register?plan=free');
    } else if (planId === 'pro') {
      router.push('/register?plan=pro');
    } else if (planId === 'enterprise') {
      router.push('/contact?subject=enterprise');
    }
  };

  return (
    <div className="pricing-container">
      <div className="pricing-content">
        <div className="pricing-header">
          <div className="logo-container">
            <div className="app-logo"></div>
            <h1>Arxio</h1>
          </div>

          <div className="welcome-text">
            <h2>תוכניות ותמחור</h2>
            <p>בחרו את התוכנית המתאימה ביותר לצרכים שלכם</p>
          </div>
        </div>

        <div className="plans-container">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`plan-card ${plan.highlighted ? 'highlighted' : ''}`}
            >
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <div className="price">
                  <span className="amount">{plan.price}</span>
                  {plan.period && <span className="period">/ {plan.period}</span>}
                </div>
                <p className="description">{plan.description}</p>
              </div>
              
              <div className="features">
                <h4>כלול בתוכנית</h4>
                <ul>
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>
                      <CheckIcon className="feature-icon" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {plan.limitations.length > 0 && (
                <div className="limitations">
                  <h4>מגבלות</h4>
                  <ul>
                    {plan.limitations.map((limitation, idx) => (
                      <li key={idx}>
                        <XIcon className="limitation-icon" size={16} />
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button 
                className={`plan-button ${plan.buttonColor}`}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div className="pricing-footer">
          <p>
            צריכים עזרה בבחירת התוכנית המתאימה? <Link href="/contact">צרו קשר</Link> עם צוות התמיכה שלנו.
          </p>
        </div>
      </div>

      <style jsx>{`
        .pricing-container {
          display: flex;
          min-height: 100vh;
          width: 100%;
          align-items: center;
          justify-content: center;
          background: #111;
          overflow: hidden;
          position: relative;
          padding: 2rem 0;
          direction: rtl;
        }

        .pricing-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(125deg, #1a1a1a, #0f172a, #0c4a6e, #0f172a, #1a1a1a);
          background-size: 400% 400%;
          animation: gradientBG 15s ease infinite;
          z-index: 0;
        }

        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .pricing-content {
          width: 90%;
          max-width: 1200px;
          background-color: rgba(10, 10, 10, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          padding: 2.5rem;
          z-index: 1;
        }

        .logo-container {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
        }

        .app-logo {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #3ecf8e, #3e8ecf);
          border-radius: 6px;
          margin-left: 0.75rem;
        }

        h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .welcome-text {
          margin-bottom: 3rem;
          text-align: center;
        }

        h2 {
          font-size: 2.2rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .welcome-text p {
          color: #94a3b8;
          font-size: 1.1rem;
        }

        .plans-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .plan-card {
          background-color: rgba(26, 32, 44, 0.4);
          border-radius: 10px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          border: 1px solid #2d3748;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .plan-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
        }

        .plan-card.highlighted {
          border: 2px solid #3ecf8e;
          box-shadow: 0 0 20px rgba(62, 207, 142, 0.3);
          position: relative;
        }

        .plan-card.highlighted::before {
          content: 'מומלץ';
          position: absolute;
          top: -12px;
          right: 50%;
          transform: translateX(50%);
          background-color: #3ecf8e;
          color: #0f172a;
          padding: 0.25rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .plan-header {
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .plan-header h3 {
          font-size: 1.5rem;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .price {
          margin-bottom: 0.75rem;
        }

        .amount {
          font-size: 2.5rem;
          font-weight: 700;
          color: #ffffff;
        }

        .period {
          font-size: 1rem;
          color: #94a3b8;
        }

        .description {
          color: #94a3b8;
          font-size: 0.95rem;
        }

        .features, .limitations {
          margin-bottom: 1.5rem;
        }

        .features h4, .limitations h4 {
          font-size: 1rem;
          color: #e2e8f0;
          margin-bottom: 1rem;
          border-bottom: 1px solid #2d3748;
          padding-bottom: 0.5rem;
        }

        .features ul, .limitations ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .features li, .limitations li {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
          color: #e2e8f0;
          font-size: 0.95rem;
        }

        .feature-icon {
          color: #3ecf8e;
          margin-left: 0.75rem;
          flex-shrink: 0;
        }

        .limitation-icon {
          color: #ef4444;
          margin-left: 0.75rem;
          flex-shrink: 0;
        }

        .plan-button {
          margin-top: auto;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .plan-button:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }

        .pricing-footer {
          text-align: center;
          color: #94a3b8;
          font-size: 0.95rem;
        }

        .pricing-footer a {
          color: #3ecf8e;
          text-decoration: none;
        }

        .pricing-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .pricing-content {
            padding: 1.5rem;
          }

          .plans-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
} 