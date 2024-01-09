import React, { useState, useEffect, useRef } from 'react';
import "./index.css";
import RecordRTC from 'recordrtc';

const App = () => {

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    let intervalId: NodeJS.Timeout | null = null;
    const [recorder, setRecorder] = useState<RecordRTC | null>(null);

    const audioData = useRef<Blob[]>([]);

    const ws = new WebSocket('ws://127.0.0.1:8000/ws');

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            setDevices(devices.filter(device => device.kind === 'audioinput'));
        });
    }, []);

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: selectedDevice } });
        const recordRTC = RecordRTC(stream, {
            type: 'audio', timeSlice: 15000,
            mimeType: 'audio/webm;codecs=opus',
            recorderType: RecordRTC.StereoAudioRecorder,
            ondataavailable: (blob: Blob) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result) {
                        const byteArray = new Uint8Array(reader.result as ArrayBuffer);
                        console.log(byteArray);
                        ws.send(byteArray);
                    }
                };
                reader.readAsArrayBuffer(blob);
            }
        });

        recordRTC.startRecording();

        setRecorder(recordRTC);
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (recorder) {
            recorder.stopRecording();
            setRecorder(null);
            setIsRecording(false);
        }
    };


    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-4xl font-bold mb-4">Audio Recorder</h1>
            <select onChange={(e) => setSelectedDevice(e.target.value)}>
                {devices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                        {device.label || device.deviceId}
                    </option>
                ))}
            </select>
            <button
                className={`bg-blue-500 text-white font-bold py-2 px-4 rounded ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={isRecording ? undefined : startRecording}
            >
                Start
            </button>
            <button
                className={`mt-4 bg-red-500 text-white font-bold py-2 px-4 rounded ${!isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={isRecording ? stopRecording : undefined}
            >
                Stop
            </button>
        </div>
    );
}

export default App;