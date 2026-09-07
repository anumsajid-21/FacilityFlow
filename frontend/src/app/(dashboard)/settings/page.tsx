"use client";

import { useEffect, useState } from "react";
import { User, Shield, Bell, Building, CreditCard, Check, RefreshCw } from "lucide-react";
import { settingsApi, providersApi, facilitiesApi, apiError } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { Card, PageHeader, Field, Input, Textarea, Loading, Tabs } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toast";

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    avatarUrl: "",
    orgName: "",
    orgDescription: "",
    orgContactEmail: "",
    orgContactPhone: "",
    orgLogoUrl: "",
    providerName: "",
    providerDescription: "",
    providerContactInfo: "",
    providerLogoUrl: "",
  });

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  // Notifications Form
  const [notifForm, setNotifForm] = useState({
    inApp: true,
    email: true,
    categories: {
      QUOTATION_RECEIVED: { inApp: true, email: true },
      JOB_STATUS_CHANGE: { inApp: true, email: true },
      APPROVAL: { inApp: true, email: true },
      PAYMENT: { inApp: true, email: true },
    },
  });

  // Provider Payout & Business Form
  const [providerForm, setProviderForm] = useState({
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    serviceAreaText: "",
    selectedCategories: [] as string[],
  });

  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const me = await settingsApi.me();
      setProfileForm({
        name: me.name || "",
        email: me.email || "",
        phone: me.phone || "",
        avatarUrl: me.avatarUrl || "",
        orgName: me.hiringOrg?.name || "",
        orgDescription: me.hiringOrg?.description || "",
        orgContactEmail: me.hiringOrg?.contactEmail || "",
        orgContactPhone: me.hiringOrg?.contactPhone || "",
        orgLogoUrl: me.hiringOrg?.logoUrl || "",
        providerName: me.provider?.name || "",
        providerDescription: me.provider?.description || "",
        providerContactInfo: me.provider?.contactInfo || "",
        providerLogoUrl: me.provider?.logoUrl || "",
      });

      if (me.provider) {
        setProviderForm({
          bankName: me.provider.bankName || "",
          accountNumber: me.provider.accountNumber || "",
          routingNumber: me.provider.routingNumber || "",
          serviceAreaText: me.provider.serviceAreaText || "",
          selectedCategories: me.provider.services?.map((s: any) => s.categoryId) || [],
        });
      }

      const notifs = await settingsApi.getNotifications();
      if (notifs) {
        setNotifForm({
          inApp: notifs.inApp ?? true,
          email: notifs.email ?? true,
          categories: (notifs.categories as any) || {
            QUOTATION_RECEIVED: { inApp: true, email: true },
            JOB_STATUS_CHANGE: { inApp: true, email: true },
            APPROVAL: { inApp: true, email: true },
            PAYMENT: { inApp: true, email: true },
          },
        });
      }

      const sess = await settingsApi.getSession();
      setSessionInfo(sess);
    } catch (e: any) {
      toast.error("Failed to load settings", apiError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    const previousUser = { ...user };
    const newName = profileForm.name.trim();

    // Optimistic UI update
    updateUser({ name: newName, phone: profileForm.phone, avatarUrl: profileForm.avatarUrl });
    setSavingProfile(true);

    try {
      const payload: any = {
        name: newName,
        phone: profileForm.phone,
        avatarUrl: profileForm.avatarUrl,
      };

      if (user?.role === "HIRING_ORG") {
        payload.hiringOrg = {
          name: profileForm.orgName,
          description: profileForm.orgDescription,
          contactEmail: profileForm.orgContactEmail,
          contactPhone: profileForm.orgContactPhone,
          logoUrl: profileForm.orgLogoUrl,
        };
      } else if (user?.role === "PROVIDER") {
        payload.provider = {
          name: profileForm.providerName,
          description: profileForm.providerDescription,
          contactInfo: profileForm.providerContactInfo,
          logoUrl: profileForm.providerLogoUrl,
        };
      }

      const updated = await settingsApi.updateProfile(payload);
      updateUser({ name: updated.name, avatarUrl: updated.avatarUrl, phone: updated.phone });
      toast.success("Profile updated", "Your account settings have been saved.");
    } catch (e: any) {
      // Rollback on error
      if (previousUser.name) updateUser(previousUser);
      toast.error("Update failed", apiError(e));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match", "Please verify your new password.");
      return;
    }
    setSavingPassword(true);
    try {
      await settingsApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed", "Your password has been updated.");
    } catch (e: any) {
      toast.error("Password change failed", apiError(e));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifs(true);
    try {
      await settingsApi.updateNotifications(notifForm);
      toast.success("Preferences saved", "Notification settings updated.");
    } catch (e: any) {
      toast.error("Failed to save", apiError(e));
    } finally {
      setSavingNotifs(false);
    }
  };

  const handleSaveProviderDetails = async () => {
    setSavingProvider(true);
    try {
      await settingsApi.updateProfile({
        provider: {
          bankName: providerForm.bankName,
          accountNumber: providerForm.accountNumber,
          routingNumber: providerForm.routingNumber,
          serviceAreaText: providerForm.serviceAreaText,
        },
      });
      toast.success("Business details saved", "Payout and service area details updated.");
    } catch (e: any) {
      toast.error("Update failed", apiError(e));
    } finally {
      setSavingProvider(false);
    }
  };

  const tabsList = [
    { key: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
    { key: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
    { key: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    ...(user?.role === "PROVIDER" ? [{ key: "payouts", label: "Business & Payouts", icon: <CreditCard className="h-4 w-4" /> }] : []),
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your profile, security, and preferences" />

      <Tabs tabs={tabsList} active={activeTab} onChange={setActiveTab} />

      {activeTab === "profile" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="border-b border-border px-5 py-4">
              <h3 className="font-semibold text-charcoal flex items-center gap-2">
                <User className="h-4 w-4 text-pine" /> Personal Info
              </h3>
            </div>
            <div className="space-y-4 p-5">
              <Field label="Full Name">
                <Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
              </Field>
              <Field label="Email Address">
                <Input value={profileForm.email} readOnly className="bg-muted/40 text-sage" />
              </Field>
              <Field label="Phone Number">
                <Input value={profileForm.phone} placeholder="+1 (555) 000-0000" onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
              </Field>
              <Field label="Avatar URL">
                <Input value={profileForm.avatarUrl} placeholder="https://..." onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })} />
              </Field>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveProfile} loading={savingProfile}>Save Profile</Button>
              </div>
            </div>
          </Card>

          {user?.role === "HIRING_ORG" && (
            <Card>
              <div className="border-b border-border px-5 py-4">
                <h3 className="font-semibold text-charcoal flex items-center gap-2">
                  <Building className="h-4 w-4 text-pine" /> Organization Details
                </h3>
              </div>
              <div className="space-y-4 p-5">
                <Field label="Organization Name">
                  <Input value={profileForm.orgName} onChange={(e) => setProfileForm({ ...profileForm, orgName: e.target.value })} />
                </Field>
                <Field label="Contact Email">
                  <Input value={profileForm.orgContactEmail} onChange={(e) => setProfileForm({ ...profileForm, orgContactEmail: e.target.value })} />
                </Field>
                <Field label="Contact Phone">
                  <Input value={profileForm.orgContactPhone} onChange={(e) => setProfileForm({ ...profileForm, orgContactPhone: e.target.value })} />
                </Field>
                <Field label="Description">
                  <Textarea value={profileForm.orgDescription} onChange={(e) => setProfileForm({ ...profileForm, orgDescription: e.target.value })} />
                </Field>
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveProfile} loading={savingProfile}>Save Organization</Button>
                </div>
              </div>
            </Card>
          )}

          {user?.role === "PROVIDER" && (
            <Card>
              <div className="border-b border-border px-5 py-4">
                <h3 className="font-semibold text-charcoal flex items-center gap-2">
                  <Building className="h-4 w-4 text-pine" /> Provider Company Profile
                </h3>
              </div>
              <div className="space-y-4 p-5">
                <Field label="Company Name">
                  <Input value={profileForm.providerName} onChange={(e) => setProfileForm({ ...profileForm, providerName: e.target.value })} />
                </Field>
                <Field label="Contact Information">
                  <Input value={profileForm.providerContactInfo} onChange={(e) => setProfileForm({ ...profileForm, providerContactInfo: e.target.value })} />
                </Field>
                <Field label="Company Description">
                  <Textarea value={profileForm.providerDescription} onChange={(e) => setProfileForm({ ...profileForm, providerDescription: e.target.value })} />
                </Field>
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveProfile} loading={savingProfile}>Save Provider Info</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "security" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="border-b border-border px-5 py-4">
              <h3 className="font-semibold text-charcoal flex items-center gap-2">
                <Shield className="h-4 w-4 text-pine" /> Change Password
              </h3>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4 p-5">
              <Field label="Current Password">
                <Input type="password" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
              </Field>
              <Field label="New Password">
                <Input type="password" required value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              </Field>
              <Field label="Confirm New Password">
                <Input type="password" required value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              </Field>
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={savingPassword}>Update Password</Button>
              </div>
            </form>
          </Card>

          <Card>
            <div className="border-b border-border px-5 py-4">
              <h3 className="font-semibold text-charcoal flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-pine" /> Active Session Info
              </h3>
            </div>
            <div className="space-y-3 p-5 text-sm">
              <div className="flex justify-between border-b border-border py-2">
                <span className="text-sage font-medium">Logged in as</span>
                <span className="text-charcoal font-semibold">{user?.email}</span>
              </div>
              <div className="flex justify-between border-b border-border py-2">
                <span className="text-sage font-medium">User Role</span>
                <span className="uppercase text-pine font-bold">{user?.role}</span>
              </div>
              <div className="flex justify-between border-b border-border py-2">
                <span className="text-sage font-medium">IP Address</span>
                <span className="text-charcoal">{sessionInfo?.ip || "127.0.0.1"}</span>
              </div>
              <div className="flex justify-between border-b border-border py-2">
                <span className="text-sage font-medium">User Agent</span>
                <span className="text-charcoal max-w-xs truncate">{sessionInfo?.userAgent || "Browser"}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "notifications" && (
        <Card>
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-semibold text-charcoal flex items-center gap-2">
              <Bell className="h-4 w-4 text-pine" /> Notification Preferences
            </h3>
          </div>
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h4 className="font-semibold text-charcoal">Global In-App Notifications</h4>
                <p className="text-xs text-sage">Receive notifications in the top bar bell menu.</p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-border text-pine focus:ring-pine"
                checked={notifForm.inApp}
                onChange={(e) => setNotifForm({ ...notifForm, inApp: e.target.checked })}
              />
            </div>

            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h4 className="font-semibold text-charcoal">Global Email Notifications</h4>
                <p className="text-xs text-sage">Receive transactional email notifications.</p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-border text-pine focus:ring-pine"
                checked={notifForm.email}
                onChange={(e) => setNotifForm({ ...notifForm, email: e.target.checked })}
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-charcoal text-sm uppercase text-sage">Notification Event Controls</h4>

              {[
                { key: "QUOTATION_RECEIVED", title: "Quotation Received / Submitted", desc: "When a quotation is received or submitted." },
                { key: "JOB_STATUS_CHANGE", title: "Job Status Changes", desc: "When a job moves to in-progress, proof, or complete." },
                { key: "APPROVAL", title: "Job Approvals & Rework", desc: "When job proof is approved or rework is requested." },
                { key: "PAYMENT", title: "Invoice & Payment Updates", desc: "When an invoice is issued or payment is recorded." },
              ].map((item) => {
                const catState = (notifForm.categories as any)[item.key] || { inApp: true, email: true };
                return (
                  <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <h5 className="font-medium text-charcoal text-sm">{item.title}</h5>
                      <p className="text-xs text-sage">{item.desc}</p>
                    </div>
                    <div className="flex gap-4 items-center text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={catState.inApp}
                          onChange={(e) =>
                            setNotifForm({
                              ...notifForm,
                              categories: {
                                ...notifForm.categories,
                                [item.key]: { ...catState, inApp: e.target.checked },
                              },
                            })
                          }
                        />
                        <span>In-App</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={catState.email}
                          onChange={(e) =>
                            setNotifForm({
                              ...notifForm,
                              categories: {
                                ...notifForm.categories,
                                [item.key]: { ...catState, email: e.target.checked },
                              },
                            })
                          }
                        />
                        <span>Email</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveNotifications} loading={savingNotifs}>Save Preferences</Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === "payouts" && user?.role === "PROVIDER" && (
        <Card>
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-semibold text-charcoal flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-pine" /> Business & Payout Details
            </h3>
          </div>
          <div className="p-5 space-y-4 max-w-xl">
            <Field label="Service Areas Covered">
              <Input
                value={providerForm.serviceAreaText}
                placeholder="e.g. Greater Austin Area, Downtown, North Campus"
                onChange={(e) => setProviderForm({ ...providerForm, serviceAreaText: e.target.value })}
              />
            </Field>

            <Field label="Bank Name">
              <Input
                value={providerForm.bankName}
                placeholder="Chase Bank / Bank of America"
                onChange={(e) => setProviderForm({ ...providerForm, bankName: e.target.value })}
              />
            </Field>

            <Field label="Account Number">
              <Input
                type="password"
                value={providerForm.accountNumber}
                placeholder="••••••••1234"
                onChange={(e) => setProviderForm({ ...providerForm, accountNumber: e.target.value })}
              />
            </Field>

            <Field label="Routing Number">
              <Input
                value={providerForm.routingNumber}
                placeholder="123456789"
                onChange={(e) => setProviderForm({ ...providerForm, routingNumber: e.target.value })}
              />
            </Field>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveProviderDetails} loading={savingProvider}>Save Business Details</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}