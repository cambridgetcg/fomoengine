"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

const Dashboard = () => {
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState("");
    const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
    const [sourceLang, setSourceLang] = useState("ja");
    const [targetLang, setTargetLang] = useState("yue");
    const [transcriptionTier, setTranscriptionTier] = useState("premium");
    const [status, setStatus] = useState<"idle" | "processing" | "complete">("idle");
    const [logs, setLogs] = useState<string[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleProcess = () => {
        setStatus("processing");
        setLogs([
            "Initializing pipeline...",
            "Loading audio/video file...",
            "Running transcription (AssemblyAI)...",
            "Building psychological context...",
            "Translating with DeepSeek...",
            "Generating voice synthesis...",
        ]);
    };

    return (
        <main className="container py-8">
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Panel - Input */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Input Source</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2 mb-4">
                                <Button
                                    variant={inputMode === "upload" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setInputMode("upload")}
                                >
                                    Upload File
                                </Button>
                                <Button
                                    variant={inputMode === "url" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setInputMode("url")}
                                >
                                    URL
                                </Button>
                            </div>
                            {inputMode === "upload" ? (
                                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                    <Input
                                        type="file"
                                        accept="video/*,audio/*,.srt,.vtt"
                                        onChange={handleFileChange}
                                        className="max-w-sm mx-auto"
                                    />
                                    <p className="text-sm text-muted-foreground mt-2">
                                        MP4, MKV, MP3, WAV, SRT, VTT
                                    </p>
                                    {file && (
                                        <Badge variant="secondary" className="mt-4">
                                            {file.name}
                                        </Badge>
                                    )}
                                </div>
                            ) : (
                                <Input
                                    placeholder="https://example.com/video.mp4"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Source Language</label>
                                    <select
                                        value={sourceLang}
                                        onChange={(e) => setSourceLang(e.target.value)}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    >
                                        <option value="ja">Japanese</option>
                                        <option value="zh">Mandarin</option>
                                        <option value="ko">Korean</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Target Language</label>
                                    <select
                                        value={targetLang}
                                        onChange={(e) => setTargetLang(e.target.value)}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    >
                                        <option value="yue">Cantonese</option>
                                        <option value="zh">Mandarin</option>
                                        <option value="en">English</option>
                                        <option value="ja">Japanese</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Transcription Tier</label>
                                    <select
                                        value={transcriptionTier}
                                        onChange={(e) => setTranscriptionTier(e.target.value)}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    >
                                        <option value="economy">Economy (Whisper)</option>
                                        <option value="standard">Standard (Groq)</option>
                                        <option value="premium">Premium (AssemblyAI)</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Options</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" defaultChecked className="rounded" />
                                    <span className="text-sm">Psychological Profiling</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" defaultChecked className="rounded" />
                                    <span className="text-sm">Dubbing Optimization</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="rounded" />
                                    <span className="text-sm">Voice Cloning</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" defaultChecked className="rounded" />
                                    <span className="text-sm">Generate SRT</span>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button
                            size="lg"
                            onClick={handleProcess}
                            disabled={status === "processing"}
                        >
                            {status === "processing" ? "Processing..." : "Start Dubbing"}
                        </Button>
                        <Button size="lg" variant="outline">
                            Subtitles Only
                        </Button>
                    </div>
                </div>

                {/* Right Panel - Status & Output */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Status
                                <Badge variant={status === "processing" ? "default" : "secondary"}>
                                    {status}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                                {logs.length === 0 ? (
                                    <p className="text-muted-foreground">Ready to process...</p>
                                ) : (
                                    logs.map((log, i) => (
                                        <p key={i} className="text-green-500">
                                            &gt; {log}
                                        </p>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Output</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" className="w-full justify-start" disabled>
                                Download Dubbed Audio (.mp3)
                            </Button>
                            <Button variant="outline" className="w-full justify-start" disabled>
                                Download Subtitles (.srt)
                            </Button>
                            <Button variant="outline" className="w-full justify-start" disabled>
                                Download Context (.json)
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold">0</p>
                                    <p className="text-xs text-muted-foreground">Segments</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">0:00</p>
                                    <p className="text-xs text-muted-foreground">Duration</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
};

export default Dashboard;
