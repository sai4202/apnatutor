import { expect, test } from "@playwright/test";
import { API, DEV_STUDENT, DEV_TUTOR, signIn } from "./support";

/**
 * The money path, automated — M6-05.2.
 *
 * <p>A student posts an enquiry, a tutor sees it, pays credits to unlock it, and gets the contact
 * details. That is the whole business model in one sequence, and it is the sequence that must never
 * be broken by a deploy.
 *
 * <p>Driven through the API rather than the UI. The rules are already covered by 250 backend tests;
 * what this adds is that the endpoints a browser actually calls, in the order a browser calls them,
 * still line up — a contract test more than a UI test. The screens themselves are covered by
 * `journeys.spec.ts`, which is where a broken form would show up.
 */
test.describe("the money path", () => {
  test("post an enquiry, unlock it, and the contact details are revealed exactly once", async ({
    request,
  }) => {
    const student = await signIn(request, DEV_STUDENT, "STUDENT");
    const tutor = await signIn(request, DEV_TUTOR, "TUTOR");

    const asStudent = { Authorization: `Bearer ${student.accessToken}` };
    const asTutor = { Authorization: `Bearer ${tutor.accessToken}` };

    // --- The student posts ------------------------------------------------------------------
    const subjects = await (await request.get(`${API}/public/catalog/subjects`)).json();
    const subjectId = subjects[0].children[0].id;

    const posted = await request.post(`${API}/student/requirements`, {
      headers: asStudent,
      data: {
        subjectId,
        mode: "ONLINE",
        budgetAmountPaise: 600_000,
        budgetUnit: "PER_MONTH",
        description:
          "End-to-end test enquiry. Looking for online sessions twice a week, evenings.",
      },
    });
    expect(posted.ok(), await posted.text()).toBeTruthy();
    const requirement = await posted.json();

    // --- The tutor needs credits ------------------------------------------------------------
    const walletBefore = await (
      await request.get(`${API}/tutor/leads/wallet`, { headers: asTutor })
    ).json();

    // A tutor with no credits cannot unlock, which is the business model working rather than a
    // test failure. Fail loudly rather than skipping: a money-path test that quietly skips
    // reports green while testing nothing.
    expect(
      walletBefore.balance,
      "the dev tutor has no credits - run the backend with --apnatutor.demo.seed=true, which grants them",
    ).toBeGreaterThan(0);

    // --- The tutor unlocks -------------------------------------------------------------------
    const unlocked = await request.post(
      `${API}/tutor/leads/${requirement.id}/unlock`,
      { headers: asTutor, data: { introMessage: "Happy to help with this." } },
    );
    expect(unlocked.ok(), await unlocked.text()).toBeTruthy();

    const lead = await unlocked.json();
    expect(
      lead.studentPhone,
      "the contact details are what the credits bought — if this is absent the product does not work",
    ).toBeTruthy();

    const walletAfter = await (
      await request.get(`${API}/tutor/leads/wallet`, { headers: asTutor })
    ).json();

    // The exact price is not asserted here. It is set by the admin-configurable pricing bands and
    // locked onto the enquiry at creation, and the backend suite covers which band applies; what
    // a browser-level test can add is that money moved, once, in the right direction.
    const charged = walletBefore.balance - walletAfter.balance;
    expect(charged, "unlocking must cost the tutor credits").toBeGreaterThan(0);

    // --- Replaying it charges nothing --------------------------------------------------------
    const replayed = await request.post(
      `${API}/tutor/leads/${requirement.id}/unlock`,
      { headers: asTutor, data: { introMessage: "Happy to help with this." } },
    );
    expect(replayed.ok()).toBeTruthy();

    const walletAfterReplay = await (
      await request.get(`${API}/tutor/leads/wallet`, { headers: asTutor })
    ).json();
    expect(
      walletAfterReplay.balance,
      "a tutor on a patchy connection retrying must not be charged twice",
    ).toBe(walletAfter.balance);

    // --- The student can see who responded ---------------------------------------------------
    const mine = await request.get(`${API}/student/requirements/${requirement.id}`, {
      headers: asStudent,
    });
    const view = await mine.json();
    expect(
      view.respondingTutors.length,
      "a student who cannot call back the tutor who paid to reach them has been sold nothing",
    ).toBeGreaterThan(0);
    expect(view.respondingTutors[0].phone).toBeTruthy();
  });

  test("an unauthenticated caller cannot unlock anything", async ({ request }) => {
    const response = await request.post(`${API}/tutor/leads/1/unlock`, {
      data: { introMessage: "no token" },
    });
    expect(response.status()).toBe(401);
  });
});
