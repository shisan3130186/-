import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ChevronRight,
  Bot,
  Captions,
  CheckCircle2,
  Clapperboard,
  FileText,
  FolderOpen,
  KeyRound,
  Layers3,
  Loader2,
  Mic2,
  Music,
  Play,
  Scissors,
  Settings,
  Sparkles,
  Trash2,
  User,
  Wand2,
} from "lucide-react";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8765";

type View = "home" | "remix";
type HomeTab = "creation" | "tools" | "automation";

interface Health {
  status: string;
  ffmpeg: boolean;
  ffprobe: boolean;
}

interface ProviderConfig {
  platform: string;
  llm_api_key: string;
  llm_base_url: string;
  llm_model: string;
  tts_api_key: string;
}

interface AppConfig {
  provider: ProviderConfig;
  output_dir: string;
}

interface VideoAsset {
  id: string;
  path: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  has_audio: boolean;
  error?: string | null;
}

interface ClipSegment {
  asset_path: string;
  asset_name: string;
  start: number;
  end: number;
  caption: string;
  reason: string;
}

interface ExportTask {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  output_path?: string | null;
  logs: string[];
  error?: string | null;
}

interface DirectoryEntry {
  name: string;
  path: string;
  parent?: string | null;
}

interface DirectoryListResponse {
  path: string;
  parent?: string | null;
  directories: DirectoryEntry[];
}

const emptyConfig: AppConfig = {
  provider: {
    platform: "openai-compatible",
    llm_api_key: "",
    llm_base_url: "",
    llm_model: "",
    tts_api_key: "",
  },
  output_dir: "",
};

const features = {
  creation: [
    {
      title: "AI 智能混剪",
      desc: "输入文案，AI 自动从素材中匹配片段，一键生成混剪视频。",
      icon: Wand2,
      tags: ["AI智能混剪", "语音合成", "字幕识别", "视频理解"],
      status: "功能可用",
      active: true,
    },
    {
      title: "视频效果处理",
      desc: "批量裁剪、变速、画中画、转场、封面、水印等 FFmpeg 工作流。",
      icon: Sparkles,
      tags: ["批量处理", "裂变", "AI分割", "差异化"],
      status: "基础规划",
      active: false,
    },
    {
      title: "分类混剪",
      desc: "按素材文件夹分类组合，支持自定义文案和音频模式。",
      icon: Layers3,
      tags: ["分类混剪", "语音合成", "多文件夹"],
      status: "规划中",
      active: false,
    },
    {
      title: "视频内容提炼",
      desc: "从长视频中抽取高价值片段，适合直播切片和知识类内容。",
      icon: Bot,
      tags: ["视频切片", "直播切片", "精华提取"],
      status: "规划中",
      active: false,
    },
  ],
  tools: [
    {
      title: "字幕识别",
      desc: "批量导入视频或音频，自动识别语音生成字幕，可导出 SRT。",
      icon: Captions,
      tags: ["音频识别", "编辑修正", "SRT导出"],
      status: "规划中",
      active: false,
    },
    {
      title: "大字报设计",
      desc: "设计营销文字海报，支持多套样式模板和一键排版。",
      icon: FileText,
      tags: ["文字设计", "样式模板", "一键排版"],
      status: "规划中",
      active: false,
    },
  ],
  automation: [
    {
      title: "自动化批量任务",
      desc: "素材监控、队列渲染、批量发布将作为第二阶段能力。",
      icon: Settings,
      tags: ["任务队列", "批量导出", "发布"],
      status: "规划中",
      active: false,
    },
  ],
};

function api<T>(path: string, init?: RequestInit): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  }).then(async (res) => {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `${res.status} ${res.statusText}`);
    }
    return res.json();
  });
}

function App() {
  const [view, setView] = useState<View>("home");
  const [tab, setTab] = useState<HomeTab>("creation");
  const [health, setHealth] = useState<Health | null>(null);
  const [config, setConfig] = useState<AppConfig>(emptyConfig);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    api<Health>("/health").then(setHealth).catch(() => setHealth(null));
    api<AppConfig>("/config").then(setConfig).catch(() => setConfig(emptyConfig));
  }, []);

  return (
    <div className="app-shell">
      <TopBar
        health={health}
        onUser={() => setSettingsOpen(true)}
        onHome={() => setView("home")}
        compact={view !== "home"}
      />
      {view === "home" ? (
        <Home tab={tab} setTab={setTab} openRemix={() => setView("remix")} />
      ) : (
        <RemixWorkspace config={config} setConfig={setConfig} />
      )}
      {settingsOpen && (
        <SettingsModal
          config={config}
          setConfig={setConfig}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

function TopBar({
  health,
  onUser,
  onHome,
  compact,
}: {
  health: Health | null;
  onUser: () => void;
  onHome: () => void;
  compact: boolean;
}) {
  return (
    <header className="topbar">
      <div className="brand" onClick={onHome}>
        {compact && <ArrowLeft size={18} />}
        <span>ECutAuto</span>
      </div>
      <div className="window-actions">
        <span className={health?.ffmpeg && health?.ffprobe ? "health ok" : "health warn"}>
          {health?.ffmpeg && health?.ffprobe ? "FFmpeg ready" : "Backend offline"}
        </span>
        <button className="icon-button" title="个人中心" onClick={onUser}>
          <User size={17} />
        </button>
        <button className="icon-button" title="设置">
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
}

function Home({
  tab,
  setTab,
  openRemix,
}: {
  tab: HomeTab;
  setTab: (tab: HomeTab) => void;
  openRemix: () => void;
}) {
  const current = features[tab];
  return (
    <main className="home">
      <section className="headline">
        <h1>智能视频批量处理工作站</h1>
        <div className="diamond" />
      </section>
      <nav className="tabs">
        <button className={tab === "creation" ? "active" : ""} onClick={() => setTab("creation")}>
          创作中心
        </button>
        <button className={tab === "tools" ? "active" : ""} onClick={() => setTab("tools")}>
          效率工具
        </button>
        <button
          className={tab === "automation" ? "active" : ""}
          onClick={() => setTab("automation")}
        >
          自动化
        </button>
      </nav>
      <section className="feature-grid">
        {current.map((item) => (
          <button
            key={item.title}
            className={`feature-card ${item.active ? "available" : ""}`}
            onClick={item.active ? openRemix : undefined}
          >
            <div className="card-head">
              <item.icon size={28} />
              <h2>{item.title}</h2>
              <span className={item.active ? "status" : "status muted"}>{item.status}</span>
            </div>
            <p>{item.desc}</p>
            <div className="tag-row">
              {item.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </button>
        ))}
      </section>
    </main>
  );
}

function SettingsModal({
  config,
  setConfig,
  onClose,
}: {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<AppConfig>(config);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const saved = await api<AppConfig>("/config", {
        method: "POST",
        body: JSON.stringify(draft),
      });
      setConfig(saved);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <section className="modal">
        <div className="modal-title">
          <h2>个人中心</h2>
          <button className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <aside className="modal-nav">
            <span className="active">
              <KeyRound size={16} /> API Key
            </span>
            <span>
              <User size={16} /> 个人信息
            </span>
          </aside>
          <div className="settings-form">
            <label>
              平台选择
              <select
                value={draft.provider.platform}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    provider: { ...draft.provider, platform: event.target.value },
                  })
                }
              >
                <option value="openai-compatible">OpenAI Compatible</option>
                <option value="volcengine">火山引擎</option>
              </select>
            </label>
            <label>
              LLM Base URL
              <input
                value={draft.provider.llm_base_url}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    provider: { ...draft.provider, llm_base_url: event.target.value },
                  })
                }
                placeholder="https://api.example.com/v1"
              />
            </label>
            <label>
              LLM API Key
              <input
                type="password"
                value={draft.provider.llm_api_key}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    provider: { ...draft.provider, llm_api_key: event.target.value },
                  })
                }
                placeholder="请输入 LLM API Key"
              />
            </label>
            <label>
              TTS API Key
              <input
                type="password"
                value={draft.provider.tts_api_key}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    provider: { ...draft.provider, tts_api_key: event.target.value },
                  })
                }
                placeholder="请输入 TTS API Key"
              />
            </label>
            <label>
              默认输出路径
              <input
                value={draft.output_dir}
                onChange={(event) => setDraft({ ...draft, output_dir: event.target.value })}
                placeholder="留空则输出到用户 Videos/AIAutoRemix"
              />
            </label>
            <button className="primary" onClick={save} disabled={saving}>
              {saving ? "保存中" : "保存"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function RemixWorkspace({
  config,
  setConfig,
}: {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
}) {
  const [folder, setFolder] = useState("");
  const [script, setScript] = useState("");
  const [assets, setAssets] = useState<VideoAsset[]>([]);
  const [segments, setSegments] = useState<ClipSegment[]>([]);
  const [task, setTask] = useState<ExportTask | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [planMessage, setPlanMessage] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<VideoAsset | null>(null);
  const [outputDir, setOutputDir] = useState(config.output_dir);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);

  useEffect(() => setOutputDir(config.output_dir), [config.output_dir]);

  useEffect(() => {
    if (!task || ["completed", "failed", "cancelled"].includes(task.status)) return;
    const timer = window.setInterval(() => {
      api<ExportTask>(`/tasks/${task.id}`).then(setTask).catch(() => undefined);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [task]);

  const scan = async () => {
    setError("");
    setBusy("scan");
    try {
      const result = await api<{ assets: VideoAsset[] }>("/scan", {
        method: "POST",
        body: JSON.stringify({ folder }),
      });
      setAssets(result.assets);
      setSelectedAsset(result.assets[0] ?? null);
      if (!outputDir.trim()) {
        setOutputDir(folder);
      }
    } catch (exc) {
      setError(String(exc));
    } finally {
      setBusy("");
    }
  };

  const createPlan = async () => {
    setError("");
    setPlanMessage("");
    setBusy("plan");
    try {
      const result = await api<{ segments: ClipSegment[]; message: string }>("/plan", {
        method: "POST",
        body: JSON.stringify({
          script,
          assets,
          target_seconds: 45,
          segments: 12,
          clip_min_seconds: 2.2,
          clip_max_seconds: 5.5,
        }),
      });
      setSegments(result.segments);
      setPlanMessage(result.message);
    } catch (exc) {
      setError(String(exc));
    } finally {
      setBusy("");
    }
  };

  const exportVideo = async () => {
    setError("");
    setBusy("export");
    try {
      const nextConfig = { ...config, output_dir: outputDir };
      await api<AppConfig>("/config", { method: "POST", body: JSON.stringify(nextConfig) });
      setConfig(nextConfig);
      const result = await api<ExportTask>("/export", {
        method: "POST",
        body: JSON.stringify({
          script,
          segments,
          settings: {
            output_dir: outputDir,
            source_folder: folder,
            resolution: "keep",
            fps: "source",
            format: "mp4",
            keep_original: true,
            naming: "prefix-index",
            threads: 1,
            copies: 1,
            subtitle_style: {},
            audio: { original_volume: 100, bgm_enabled: false, tts_enabled: false },
          },
        }),
      });
      setTask(result);
    } catch (exc) {
      setError(String(exc));
    } finally {
      setBusy("");
    }
  };

  const previewSrc = useMemo(() => {
    if (!selectedAsset) return "";
    return `${API_BASE}/media/preview?path=${encodeURIComponent(selectedAsset.path)}`;
  }, [selectedAsset]);

  return (
    <main className="workspace">
      <aside className="asset-panel">
        <div className="import-row">
          <input
            value={folder}
            onChange={(event) => setFolder(event.target.value)}
            placeholder="输入素材文件夹路径，例如 E:\\videos"
          />
          <button className="accent" onClick={() => setFolderPickerOpen(true)}>
            <FolderOpen size={16} />
            选择
          </button>
          <button className="accent" onClick={scan} disabled={!folder || busy === "scan"}>
            {busy === "scan" ? "扫描中" : "导入文件夹"}
          </button>
          <button className="icon-button" title="清空" onClick={() => setAssets([])}>
            <Trash2 size={16} />
          </button>
        </div>
        <div className="asset-list">
          {assets.length === 0 ? (
            <div className="empty">
              <FolderOpen size={48} />
              <strong>暂无文件夹</strong>
              <span>输入路径后扫描视频素材</span>
            </div>
          ) : (
            assets.map((asset) => (
              <button
                key={asset.id}
                className={`asset-item ${selectedAsset?.id === asset.id ? "selected" : ""}`}
                onClick={() => setSelectedAsset(asset)}
              >
                <Clapperboard size={18} />
                <span>{asset.name}</span>
                <small>
                  {formatDuration(asset.duration)} · {asset.width}x{asset.height}
                </small>
              </button>
            ))
          )}
        </div>
        <label className="output-path">
          输出路径
          <input
            value={outputDir}
            onChange={(event) => setOutputDir(event.target.value)}
            placeholder="默认用户视频目录"
          />
        </label>
      </aside>

      <section className="center-panel">
        <div className="preview">
          <strong>视频预览</strong>
          {previewSrc ? (
            <video controls src={previewSrc} />
          ) : (
            <div className="empty">
              <Play size={42} />
              <span>选择素材后在此预览</span>
            </div>
          )}
        </div>
        <div className="script-card">
          <div className="section-head">
            <strong>视频文案</strong>
            <button className="accent" onClick={createPlan} disabled={!assets.length || busy === "plan"}>
              <Sparkles size={16} />
              {busy === "plan" ? "分析中" : "AI 一键分析"}
            </button>
          </div>
          <textarea
            value={script}
            onChange={(event) => setScript(event.target.value)}
            placeholder="粘贴文案。MVP 会先用确定性算法把文案句子映射到素材片段；接入 LLM 后可升级为语义匹配。"
          />
        </div>
        <div className="segments">
          <div className="section-head">
            <strong>切片列表</strong>
            <span>{segments.length} 个片段</span>
          </div>
          {planMessage && <p className="hint-line">{planMessage}</p>}
          {segments.length === 0 ? (
            <div className="empty small">
              <Scissors size={30} />
              <span>尚未创建切片组</span>
            </div>
          ) : (
            segments.map((segment, index) => (
              <div className="segment" key={`${segment.asset_path}-${index}`}>
                <b>{index + 1}</b>
                <span>{segment.asset_name}</span>
                <small>
                  {segment.start.toFixed(1)}s - {segment.end.toFixed(1)}s
                </small>
                <em>{segment.caption}</em>
              </div>
            ))
          )}
        </div>
      </section>

      <aside className="control-panel">
        <ControlGroup title="音频设置" icon={<Music size={18} />}>
          <label>
            原视频音量 <span>100%</span>
            <input type="range" min="0" max="100" defaultValue="100" />
          </label>
          <label className="switch-line">
            背景音乐 <input type="checkbox" />
          </label>
        </ControlGroup>
        <ControlGroup title="语音合成" icon={<Mic2 size={18} />}>
          <label className="switch-line">
            小何 2.0 <input type="checkbox" />
          </label>
          <label>
            语速调整 <span>1.0x</span>
            <input type="range" min="0" max="100" defaultValue="50" />
          </label>
        </ControlGroup>
        <ControlGroup title="文本/字幕样式" icon={<Captions size={18} />}>
          <label>
            字号大小 <span>56</span>
            <input type="range" min="20" max="90" defaultValue="56" />
          </label>
          <div className="swatches">
            {["#fff", "#f7d34a", "#4bd6ff", "#14d4aa", "#f25f7a", "#111"].map((color) => (
              <span key={color} style={{ background: color }} />
            ))}
          </div>
        </ControlGroup>
        <ControlGroup title="去除水印" icon={<CheckCircle2 size={18} />}>
          <label className="switch-line">
            智能填充 <input type="checkbox" disabled />
          </label>
        </ControlGroup>
        <button
          className="render-button"
          onClick={exportVideo}
          disabled={!segments.length || busy === "export"}
        >
          {busy === "export" ? <Loader2 className="spin" size={18} /> : <Play size={18} />}
          开始处理
        </button>
        {task && (
          <div className="task-card">
            <div className="task-top">
              <strong>{task.status}</strong>
              <span>{task.progress.toFixed(0)}%</span>
            </div>
            <div className="progress">
              <span style={{ width: `${task.progress}%` }} />
            </div>
            {task.output_path && <p>{task.output_path}</p>}
            {task.error && <p className="error">{task.error}</p>}
            <pre>{task.logs.slice(-6).join("\n")}</pre>
          </div>
        )}
        {error && <p className="error">{error}</p>}
      </aside>
      {folderPickerOpen && (
        <FolderPicker
          onClose={() => setFolderPickerOpen(false)}
          onSelect={(path) => {
            setFolder(path);
            setFolderPickerOpen(false);
          }}
        />
      )}
    </main>
  );
}

function FolderPicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (path: string) => void;
}) {
  const [current, setCurrent] = useState("");
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [parent, setParent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = async (path?: string) => {
    setLoading(true);
    setLoadError("");
    try {
      const endpoint = path
        ? `/filesystem/list?path=${encodeURIComponent(path)}`
        : "/filesystem/roots";
      const result = await api<DirectoryListResponse>(endpoint);
      setCurrent(result.path);
      setParent(result.parent ?? null);
      setEntries(result.directories);
    } catch (exc) {
      setEntries([]);
      setLoadError(String(exc));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="modal-backdrop">
      <section className="folder-modal">
        <div className="modal-title">
          <h2>选择素材文件夹</h2>
          <button className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="folder-toolbar">
          <button className="accent" onClick={() => load()}>
            磁盘
          </button>
          <button className="accent" onClick={() => parent && load(parent)} disabled={!parent}>
            上一级
          </button>
          <input value={current || "选择磁盘"} readOnly />
          <button className="primary" onClick={() => current && onSelect(current)} disabled={!current}>
            选定此文件夹
          </button>
        </div>
        <div className="folder-list">
          {loading ? (
            <div className="empty small">
              <Loader2 className="spin" size={30} />
              <span>读取目录中</span>
            </div>
          ) : loadError ? (
            <div className="empty small">
              <FolderOpen size={30} />
              <span>目录加载失败</span>
              <small>{loadError}</small>
              <button className="accent" onClick={() => load(current || undefined)}>
                重新加载
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="empty small">
              <FolderOpen size={30} />
              <span>没有可进入的子目录</span>
              {!current && (
                <button className="accent" onClick={() => load()}>
                  重新加载磁盘
                </button>
              )}
            </div>
          ) : (
            entries.map((entry) => (
              <button key={entry.path} className="folder-entry" onClick={() => load(entry.path)}>
                <FolderOpen size={18} />
                <span>{entry.name}</span>
                <ChevronRight size={17} />
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function ControlGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="control-group">
      <h3>
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function formatDuration(seconds: number) {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

createRoot(document.getElementById("root")!).render(<App />);
