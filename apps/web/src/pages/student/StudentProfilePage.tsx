import { type FormEvent, useEffect, useState } from "react";
import { STUDENT_GENDERS, UpdateStudentProfileInputSchema } from "@arva/shared";
import { api, ApiError, type StudentProfile } from "@/lib/api";
import {
  applyApiFormError,
  parseWithSchema,
  type FieldErrors,
} from "@/lib/formErrors";
import { toast } from "@/lib/toast";
import { Field } from "@/components/Field";
import { useAuth } from "@/features/auth/AuthProvider";

const GENDER_LABELS: Record<(typeof STUDENT_GENDERS)[number], string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  PREFER_NOT_TO_SAY: "Prefer not to say",
};

export function StudentProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [phone, setPhone] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [nidNumber, setNidNumber] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [occupation, setOccupation] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .studentProfile()
      .then((r) => {
        setProfile(r.profile);
        setPhone(r.profile.phone ?? "");
        setWhatsappPhone(r.profile.whatsappPhone ?? "");
        setDateOfBirth(r.profile.dateOfBirth ?? "");
        setGender(r.profile.gender ?? "");
        setNidNumber(r.profile.nidNumber ?? "");
        setAddressLine(r.profile.addressLine ?? "");
        setCity(r.profile.city ?? "");
        setDistrict(r.profile.district ?? "");
        setGuardianName(r.profile.guardianName ?? "");
        setGuardianPhone(r.profile.guardianPhone ?? "");
        setEducationLevel(r.profile.educationLevel ?? "");
        setOccupation(r.profile.occupation ?? "");
      })
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError(null);

    const parsed = parseWithSchema(UpdateStudentProfileInputSchema, {
      phone,
      whatsappPhone: whatsappPhone.trim() || null,
      dateOfBirth: dateOfBirth.trim() || null,
      gender: gender || null,
      nidNumber: nidNumber.trim() || null,
      addressLine: addressLine.trim() || null,
      city: city.trim() || null,
      district: district.trim() || null,
      guardianName: guardianName.trim() || null,
      guardianPhone: guardianPhone.trim() || null,
      educationLevel: educationLevel.trim() || null,
      occupation: occupation.trim() || null,
    });
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.formError);
      setSaving(false);
      return;
    }

    try {
      const res = await api.updateStudentProfile(parsed.data);
      setProfile(res.profile);
      toast.success("Profile updated");
    } catch (err) {
      applyApiFormError(err, setFieldErrors, setFormError, "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-ink-muted">Loading…</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Profile</h1>
        <p className="mt-1 text-ink-muted">Your student account details.</p>
      </div>

      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </p>
      ) : null}

      <div className="rounded-xl border border-border bg-surface-elevated p-6">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-ink-muted">Name</dt>
            <dd className="font-medium">{profile?.fullName ?? user?.fullName}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Email</dt>
            <dd className="font-medium">{profile?.email ?? user?.email}</dd>
          </div>
        </dl>

        <form noValidate onSubmit={onSubmit} className="mt-6 space-y-6">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Contact
            </h2>
            <Field label="Phone" error={fieldErrors.phone}>
              <input
                id="phone"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+8801…"
              />
            </Field>
            <Field label="WhatsApp (optional)" error={fieldErrors.whatsappPhone}>
              <input
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+8801…"
              />
            </Field>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Personal
            </h2>
            <Field label="Date of birth" error={fieldErrors.dateOfBirth}>
              <input
                type="date"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </Field>
            <Field label="Gender" error={fieldErrors.gender}>
              <select
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">—</option>
                {STUDENT_GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {GENDER_LABELS[g]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="NID (optional)" error={fieldErrors.nidNumber}>
              <input
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={nidNumber}
                onChange={(e) => setNidNumber(e.target.value)}
              />
            </Field>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Address
            </h2>
            <Field label="Address" error={fieldErrors.addressLine}>
              <input
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
              />
            </Field>
            <Field label="City" error={fieldErrors.city}>
              <input
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </Field>
            <Field label="District" error={fieldErrors.district}>
              <input
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </Field>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Guardian
            </h2>
            <Field label="Guardian name" error={fieldErrors.guardianName}>
              <input
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
              />
            </Field>
            <Field label="Guardian phone" error={fieldErrors.guardianPhone}>
              <input
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
              />
            </Field>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Other
            </h2>
            <Field label="Education level" error={fieldErrors.educationLevel}>
              <input
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
              />
            </Field>
            <Field label="Occupation" error={fieldErrors.occupation}>
              <input
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
              />
            </Field>
          </section>

          {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
