"use client";

import { useEffect, useMemo, useState, type FormEvent, type ChangeEvent } from "react";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const BUCKET = "learning-files";
const MAX_SIZE = 50 * 1024 * 1024;
const BLOCKED = /\.(exe|msi|bat|cmd|com|dll|scr|ps1|sh|apk|jar)$/i;

type StoredFile = { name: string; id: string | null; metadata?: { size?: number; mimetype?: string } | null; created_at?: string | null };

export default function Home() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [configError, setConfigError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) { setConfigError("Connect a Supabase project by adding the two environment variables in Vercel."); return; }
    const client = createClient(url, key);
    setSupabase(client);
    client.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function refreshFiles(client = supabase, account = user) {
    if (!client || !account) return;
    const { data, error } = await client.storage.from(BUCKET).list(account.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (error) { setMessage(error.message); return; }
    setFiles((data ?? []).filter(item => item.name !== ".emptyFolderPlaceholder").map(item => ({ ...item, name: item.name })));
  }

  useEffect(() => { if (supabase && user) void refreshFiles(supabase, user); }, [supabase, user]);

  async function authenticate(e: FormEvent) {
    e.preventDefault(); if (!supabase) return;
    setBusy(true); setMessage("");
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup" && !result.data.session) setMessage("Check your email to confirm your account, then sign in.");
    else setMessage(mode === "signup" ? "Account created." : "Signed in.");
  }

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    if (!supabase || !user) return;
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    setBusy(true); setMessage("");
    for (const file of selected) {
      if (file.size > MAX_SIZE) { setMessage(file.name + " exceeds the 50 MB limit."); continue; }
      if (BLOCKED.test(file.name)) { setMessage(file.name + " is a blocked executable or script file."); continue; }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = user.id + "/" + crypto.randomUUID() + "-" + safeName;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (error) setMessage(error.message); else setMessage("Upload complete: " + file.name);
    }
    await refreshFiles(); setBusy(false); e.target.value = "";
  }

  async function openFile(file: StoredFile) {
    if (!supabase || !user) return;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(user.id + "/" + file.name, 60);
    if (error) setMessage(error.message); else if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function deleteFile(file: StoredFile) {
    if (!supabase || !user || !window.confirm("Delete " + file.name + "?")) return;
    const { error } = await supabase.storage.from(BUCKET).remove([user.id + "/" + file.name]);
    setMessage(error ? error.message : "File deleted.");
    if (!error) await refreshFiles();
  }

  const visibleFiles = useMemo(() => files.filter(f => f.name.toLowerCase().includes(query.toLowerCase())), [files, query]);

  if (!user) return <main className="auth-shell"><section className="brand-panel"><div className="monogram">CW<span>&</span>C</div><p className="eyebrow">YOUR PRIVATE LEARNING SPACE</p><h1>Callum White<br />and Cooper</h1><p className="muted">A considered home for your notes, documents and learning resources.</p><div className="ornament">✦ &nbsp; EST. FOR LEARNING &nbsp; ✦</div></section><section className="auth-panel"><div className="auth-card"><p className="eyebrow">WELCOME</p><h2>{mode === "signin" ? "Sign in to your library" : "Create your account"}</h2><p className="muted">Access your personal collection from any device.</p>{configError && <div className="notice">{configError}</div>}<form onSubmit={authenticate}>{mode === "signup" && <label>Full name<input value={name} onChange={e => setName(e.target.value)} required autoComplete="name" /></label>}<label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label><button disabled={!supabase || busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button></form><button className="text-button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>{mode === "signin" ? "New here? Create an account" : "Already registered? Sign in"}</button>{message && <p className="feedback">{message}</p>}<p className="fine-print">Your files are private to your account. Never share your password.</p></div></section></main>;

  return <main className="dashboard"><header className="topbar"><a className="wordmark" href="#"><span className="small-mark">CW&C</span> Callum White and Cooper</a><div className="account"><span>{user.email}</span><button className="outline-button" onClick={() => supabase?.auth.signOut()}>Sign out</button></div></header><section className="welcome"><p className="eyebrow">YOUR LIBRARY</p><h1>Good to have you here.</h1><p className="muted">Keep your learning resources organised in one private place.</p></section><section className="library"><div className="library-heading"><div><h2>Your files</h2><p className="muted">{files.length} {files.length === 1 ? "file" : "files"} stored</p></div><div className="upload-actions"><label className="upload-button pdf-upload">＋ Upload PDFs<input type="file" accept=".pdf,application/pdf" multiple onChange={upload} disabled={busy} /></label><label className="upload-button">＋ Upload files<input type="file" multiple onChange={upload} disabled={busy} /></label></div></div><div className="toolbar"><input placeholder="Search your files…" value={query} onChange={e => setQuery(e.target.value)} /></div>{message && <p className="feedback">{message}</p>}{visibleFiles.length ? <div className="file-list">{visibleFiles.map(file => <article className="file-row" key={file.name}><div className="file-icon">▤</div><div className="file-info"><strong>{file.name.replace(/^[0-9a-f-]{36}-/, "")}</strong><span>{file.metadata?.size ? (file.metadata.size / 1024 / 1024).toFixed(2) + " MB" : "Stored privately"}</span></div><button className="outline-button" onClick={() => openFile(file)}>Open</button><button className="delete-button" onClick={() => deleteFile(file)} aria-label={"Delete " + file.name}>Delete</button></article>)}</div> : <div className="empty-state"><div className="empty-icon">✧</div><h3>Your library is ready</h3><p className="muted">Upload PDFs, documents, spreadsheets, presentations, images, audio and video to get started.</p></div>}<p className="fine-print">Maximum 50 MB per file. Executables and script files are not accepted.</p></section></main>;
}