import { type PublicReview } from "@/lib/api";
import { StarRating } from "@/components/StarRating";

/**
 * The reviews section of a public tutor profile.
 *
 * Server-rendered with the rest of the page. Reviews are much of what a parent
 * comes to this page to read, and a client-fetched list would be invisible to a
 * crawler on the one page whose whole purpose is being found.
 */
export function TutorReviews({
  reviews,
  tutorName,
}: {
  reviews: PublicReview[];
  tutorName: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold">
        Reviews
        {reviews.length > 0 && (
          <span className="ml-2 text-base font-normal text-ink-500">
            ({reviews.length})
          </span>
        )}
      </h2>

      {reviews.length === 0 ? (
        <p className="mt-3 leading-relaxed text-ink-600">
          No reviews yet. Only students who have actually been put in touch with{" "}
          {tutorName} can leave one — which is why there are fewer reviews here
          than on some sites, and why the ones there are mean something.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-xl bg-ink-50/60 p-5 ring-1 ring-ink-200/70"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StarRating rating={review.rating} showNumber />
                <span className="text-sm text-ink-500">
                  {review.reviewerName} · {formatMonth(review.createdAt)}
                </span>
              </div>

              {review.title && (
                <h3 className="mt-3 font-semibold text-ink-900">
                  {review.title}
                </h3>
              )}
              {review.body && (
                <p className="mt-1.5 whitespace-pre-line leading-relaxed text-ink-700">
                  {review.body}
                </p>
              )}

              {review.tutorReply && (
                <div className="mt-4 border-l-2 border-brand-300 pl-4">
                  <p className="text-sm font-semibold text-ink-900">
                    {tutorName} replied
                  </p>
                  <p className="mt-1 whitespace-pre-line leading-relaxed text-ink-700">
                    {review.tutorReply}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}
