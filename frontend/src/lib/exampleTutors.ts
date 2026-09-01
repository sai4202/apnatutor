import type { TutorSummary } from "@/components/TutorCard";

/**
 * Example tutor profiles.
 *
 * Used by the hero preview and by the tutor profile page, so the card and the
 * page it opens agree with each other. Every surface that shows these also
 * labels them as examples — implying a supply of tutors that does not exist yet
 * would be a lie the first parent to search would catch.
 *
 * This module disappears in M2, when the search and profile endpoints return
 * real tutors. The shape below is deliberately the shape those endpoints must
 * return, so the swap is a data-source change rather than a rewrite.
 *
 * Fees are in paise, matching the API (SOURCE_OF_TRUTH.md §5).
 */
export interface ExampleTutor extends TutorSummary {
  slug: string;
  about: string;
  qualifications: { degree: string; institution: string; year: number }[];
  languages: string[];
  availability: string;
  offersDemo: boolean;
  travelRadiusKm: number;
}

export const EXAMPLE_TUTORS: ExampleTutor[] = [
  {
    slug: "ananya-reddy",
    name: "Ananya Reddy",
    headline: "Physics & Maths, Classes 9–12",
    subjects: ["Physics", "Mathematics", "CBSE"],
    rating: 4.9,
    reviewCount: 34,
    feeFromPaise: 450000,
    feeUnit: "PER_MONTH",
    locality: "Gachibowli",
    city: "Hyderabad",
    experienceYears: 8,
    verified: true,
    modes: ["STUDENT_HOME", "ONLINE"],
    about:
      "I teach Physics and Mathematics to students in Classes 9 to 12, mostly CBSE. My focus is on building intuition before formulas — once a student can picture what is happening, the equations stop feeling arbitrary. I keep batches small and share a weekly progress note with parents.",
    qualifications: [
      { degree: "M.Sc. Physics", institution: "University of Hyderabad", year: 2016 },
      { degree: "B.Sc. (Hons) Physics", institution: "Osmania University", year: 2014 },
    ],
    languages: ["English", "Telugu", "Hindi"],
    availability: "Weekday evenings after 5 PM, and Saturday mornings",
    offersDemo: true,
    travelRadiusKm: 8,
  },
  {
    slug: "rahul-sharma",
    name: "Rahul Sharma",
    headline: "JEE Main & Advanced coaching",
    subjects: ["JEE Main", "Physics", "Chemistry"],
    rating: 4.8,
    reviewCount: 51,
    feeFromPaise: 800000,
    feeUnit: "PER_MONTH",
    locality: "Madhapur",
    city: "Hyderabad",
    experienceYears: 12,
    verified: true,
    modes: ["ONLINE"],
    about:
      "Twelve years preparing students for JEE Main and Advanced. I teach online only, which lets me keep batches to eight students and give everyone real attention. Every session ends with a problem set, and I mark them personally rather than handing out solution keys.",
    qualifications: [
      { degree: "B.Tech, Mechanical Engineering", institution: "IIT Kanpur", year: 2012 },
    ],
    languages: ["English", "Hindi"],
    availability: "Six days a week, evening batches",
    offersDemo: true,
    travelRadiusKm: 0,
  },
  {
    slug: "meera-iyer",
    name: "Meera Iyer",
    headline: "Spoken English & IELTS",
    subjects: ["Spoken English", "IELTS"],
    rating: 4.7,
    reviewCount: 22,
    feeFromPaise: 60000,
    feeUnit: "PER_HOUR",
    locality: "Kondapur",
    city: "Hyderabad",
    experienceYears: 5,
    verified: true,
    modes: ["STUDENT_HOME"],
    about:
      "I work with adults and college students on spoken English and IELTS preparation. Most people who come to me can already read and write well but freeze when they have to speak. We spend most of each session actually talking, because that is the only thing that fixes it.",
    qualifications: [
      { degree: "M.A. English Literature", institution: "EFLU Hyderabad", year: 2019 },
      { degree: "CELTA", institution: "British Council", year: 2020 },
    ],
    languages: ["English", "Tamil", "Hindi", "Telugu"],
    availability: "Flexible, including weekends",
    offersDemo: true,
    travelRadiusKm: 6,
  },
];

export function findExampleTutor(slug: string): ExampleTutor | undefined {
  return EXAMPLE_TUTORS.find((tutor) => tutor.slug === slug);
}
