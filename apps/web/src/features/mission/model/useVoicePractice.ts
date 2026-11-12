import { useEffect, useRef, useState } from 'react';
export function useVoicePractice() {
  const recorder = useRef<MediaRecorder | undefined>(undefined);
  const stream = useRef<MediaStream | undefined>(undefined);
  const url = useRef('');
  const alive = useRef(true);
  const ticket = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [recording, setRecording] = useState(false);
  const [clip, setClip] = useState('');
  const [error, setError] = useState('');
  function stop() {
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
    clearTimeout(timer.current);
    setRecording(false);
  }
  async function start() {
    const request = ++ticket.current;
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Bu brauzerda ovoz yozish mavjud emas. Ovoz chiqarib takrorlab davom eting.');
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current || request !== ticket.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      const device = new MediaRecorder(media);
      recorder.current = device;
      const chunks: BlobPart[] = [];
      device.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      device.onstop = () => {
        media.getTracks().forEach((track) => track.stop());
        if (!alive.current || request !== ticket.current) return;
        if (url.current) URL.revokeObjectURL(url.current);
        url.current = URL.createObjectURL(new Blob(chunks, { type: device.mimeType }));
        setClip(url.current);
        setRecording(false);
      };
      device.start();
      setRecording(true);
      setClip('');
      timer.current = setTimeout(stop, 8000);
    } catch {
      if (alive.current)
        setError('Mikrofon ochilmadi. Ruxsatni tekshiring yoki ovoz chiqarib takrorlang.');
    }
  }
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      ticket.current++;
      clearTimeout(timer.current);
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
      if (url.current) URL.revokeObjectURL(url.current);
    };
  }, []);
  return { recording, clip, error, start, stop };
}
