# Brite Smile Dental Care — Review Engine Profile

Built to match the same schema as `saluja-dento-max`, fully customized for this client.

## Before going live, do these 2 things:
1. **Add `logo.png`** to this folder (this zip doesn't include one — drop the clinic's actual logo here, same filename/path referenced in `profile.json` → `business.logoUrl`).
2. **Fill `business.googleReviewUrl`** in `profile.json` with the real Google review short-link for Brite Smile Dental Care's GBP listing (Share review link from Google Business Profile → paste it in).

## What's customized here vs. Saluja Dento Max
- Business: Brite Smile Dental Care, Dr. Priyank Prakash, 288/222 Aryanagar, Aishbagh Road, near Naka Hindola Chouraha / Radical Palace, Charbagh, Lucknow – 226004. Phone +91 94150 04719.
- **Single-doctor clinic**, not multi-dentist — every "multiple dentists under one roof" line from Saluja was rewritten into "Dr. Priyank personally handles your case start to finish," which is actually a stronger trust angle for a solo-practice GBP than a generic multi-specialist claim.
- Services expanded/re-ordered to match the exact services in your GBP title: RCT, Implants, Fixed Teeth, Dentures, Invisalign — each has its own dedicated `{{service}}` keyword set, on top of the standard whitening/scaling/extraction/veneers/pediatric/gum-treatment list.
- Location keywords rebuilt around Lucknow/Charbagh/Aryanagar/Naka Hindola, with Aishbagh, Alambagh, Hazratganj, Chowk and Rajajipuram as nearby-area mentions (real neighbourhoods around Charbagh), plus a couple of "near Charbagh railway station" lines since that's a strong, unique local landmark this clinic can own that Saluja's profile didn't have.
- Every language pool (English / Hindi / Hinglish / Mixed) was expanded slightly beyond the original — a few extra intros, an SEO line anchored to the railway station landmark, and trust lines about transparent/upfront pricing (a genuine local-SEO trust signal for dental leads that wasn't in the original template).
- `maxKeywordsPerReview: 2` and language probabilities kept the same as Saluja (Hinglish-dominant, 45/25/20/10) since Lucknow and Kanpur patient bases behave the same way for this — adjust if you find Lucknow reviewers skew more/less Hindi in practice.

## Structure
```
brite-smile-dental-care/
  profile.json
  logo.png          ← add this
  phrases/
    english/  {intros, outros, emotional, service, seo, trust, emojis}.json
    hindi/    {...same 7 files...}
    hinglish/ {...same 7 files...}
    mixed/    {...same 7 files...}
```
