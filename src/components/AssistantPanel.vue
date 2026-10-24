<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getAvatarAuthInfo, type AvatarAuthInfo } from '@/api/avatar'; 
import { RTCPlayer } from '@/utils/player/rtcplayer.esm.js';
import { MagicStick, Setting, Fold } from '@element-plus/icons-vue';

const backgrounds = [
  "22SLM2teIw+aqR6Xsm2JbH6Ng310kDam2NiCY/RQ9n6s3nYJXloZWW1l64/g32vrn7d2lJQR7m9xD5EHYkVs1y5UXfVOOqOugB+tkorAwKpLQuFC6VTt7TsfYFCtCHQmHAcFAlPp6tbZAZCl5f3mjwmm/F8t862D9rbS4OwxH8UZMsgBp7qnhGqgSNJIzvupNLdtpeYFZfSsOZkqJ7dfD7uuMWyGcA2jyvoQsvAPLJYQ1O6N9lunfQBLJ16oOCN0QMKNGTIsDz/4wbYESs70aF1pEtOdnbh6zDO8fUXNs5OJfgPCHG0gdr9SceV42/cyCzvA0lRF9i3XBqOnqUXM+JpjTTDRwDjr92ZJz2mGh8g=",
  "22SLM2teIw+aqR6Xsm2JbH6Ng310kDam2NiCY/RQ9n6s3nYJXloZWW1l64/g32vrn7d2lJQR7m9xD5EHYkVs11q6iyicE83IOU84BIS9z5xptocz692Qr+oDHeKIv0M86AvLqcLYGZBAgJOwVpSrim1LtJky1TMUUcf4AibxiiIe2Euh+SF+/M0XJTC866YGTELfcjVJ05UXGOmdZR2zebOoTJhqHm9qiMMbPWnun3lClzOq2TJjiZ54bQZkWYPly5ZqNqV5+HZmy5Z7KhllqjKIU9gujn27gNGc/O30y1ogYzOQPkyxUpCW9m7Mh/sfruKybOJrqC8+dRxVa7hZWB0ggouCy3YpR0x0yMZJZ4Y=",
  "22SLM2teIw+aqR6Xsm2JbH6Ng310kDam2NiCY/RQ9n6s3nYJXloZWW1l64/g32vrn7d2lJQR7m9xD5EHYkVs12UqRPqqFYDyHm59P9VNWjdhO9GRj21UzEYFOLD6RL5q4mFdNEAj7PejnCRxxajblpgsAw8TAjNz297/WWR+LUJ5x6oQIZ4ZBiuo35OqEOEXxxsfh60AVf7wtufotpvcn+mf/dn0gEx0ih6zdlxE2qM5fnSU06e96Ir4rRM6DiL5tAQ0DbctwZVrYKVgKCRLkgWNXtd/IdnRKegIqZN/PYtfsVbDl60K3hNxiHs+BFhLTuBejeW53PGVAHD0+0vYDiDEGD62uRWg57z84NV01P8=",
  "22SLM2teIw+aqR6Xsm2JbH6Ng310kDam2NiCY/RQ9n6s3nYJXloZWW1l64/g32vrn7d2lJQR7m9xD5EHYkVs136hXntf4xNd9LzchoWiJaQrmTe0JNqe3WmyT3dcuTNoDwMzkPqfnqhXiDZh/9e57CLvLNFyr/K+q1OYLaRRpfHxYC4N1s5LwGn44ZSn6FvgyocORIlZc140CUqg9CK2+t8rQLVqmOGQ/tPJPdmqhmC6YJD8PQB0FFNamu6c/Y8D3p/fUEOJoyuW06BXofo72P0J+eXb8JbGFvRblbcW8v0arpo141+0QIXOdskUXtXrqTwiTCVjnSTfYMrFz90J4upzYjbuvFT8Uo1uKMOG4Bk=",
  "22SLM2teIw+aqR6Xsm2JbH6Ng310kDam2NiCY/RQ9n6s3nYJXloZWW1l64/g32vrn7d2lJQR7m9xD5EHYkVs17xkGqNVE6ld4swrL5p+wBqythHkJfgP0xL5bM0wshKpL8L42ZXBvjt2aVOqi3j8buRwC+JSdweiS0goAEHd5bUrU4TFloIA01Y/XA1dcwAkQO6gio/JHzQ8OU8JFKnOV8yCBqD3ihlllvyyyYerslAEnU6FuxeFkr3HgfpODQb37XznsY37/pTknBevNXx9W1cyLzbruGfwKngf7n5N7nTW8P9wz+Uj7hgcrQa8U/nbVODf0D84K2Dz4ZHJNq4oAc9j7U7n/mUgBYLBiOB8Ih4="
];

const avatarsList = [
  { 
    id: "111306001", 
    name: "婉柠 (默认)",
    actions: [
      "A_RLH_sit_lclench_O", "A_RH_sit_good_O", "A_RLH_welcome_O", 
      "A_RLH_sit_like_O", "A_RLH_speak_O", "A_RH_sit_emphasize_O", 
      "A_RH_invite_O", "A_RH_introduced2_O_1", "A_LH_introduced_O", 
      "A_LH_emphasize2_O", "A_LRH_emphasize2_twice_O"
    ]
  },
  { id: "138801001", name: "安安", actions: ["A_H_look_around_O", "A_LH_look_O", "A_LH_look_top_O", "A_LH_wave_C", "A_RH_bye_C", "A_RH_raise_hand_O", "A_RLH_applaud_C", "A_RLH_fold_hand_O", "A_RLH_unfold_hand_O", "A_U_show_O"] },
  { id: "110117005", name: "晓姿", actions: ["A_LH_introduced_O", "A_LH_please_O", "A_RH_click1_O", "A_RLH_emphasize_O", "A_RLH_welcome_O"] },
  { id: "110592024", name: "明轩", actions: ["A_RH_click1_O", "A_RH_emphasize2_O", "A_RH_please1_O", "A_RLH_emphasize_O", "A_RLH_welcome_O"] },
  { id: "130033001", name: "可爱", actions: ["A_kiss_O_HU", "A_RH_emphasize_O", "A_RH_think1_O", "A_RLH_adore_O", "A_RLH_applause_O", "A_RLH_welcome_O", "A_U_think2_O"] },
  { id: "111140001", name: "风屿", actions: ["A_U_jushanzi_C", "A_U_shanshanzi_C"] },
  { id: "110335005", name: "Linna", actions: ["A_LH_introduced_O", "A_LH_please_O", "A_RLH_introduced_O", "A_RLH_welcome_O"] },
  { id: "111182004", name: "明朗", actions: ["A_LH_emphasize2_O", "A_LH_Show_forward_O", "A_LH_Show_left_O", "A_LH_Show_left_up_O", "A_LH_wave_C", "A_LRH_emphasize2_O", "A_LRH_emphasize2_twice_O", "A_RLH_sit_emphasize_xhands_O", "A_RLH_welcome_O"] },
  { id: "111165001", name: "昭昭", actions: ["A_LH_jieshao_O", "A_LH_please_O", "A_LH_Show_left_O", "A_RLH_welcome_O"] }
];

const voicesList = [
  { vcn: "x4_lingxiaoying_assist", name: "聆小璎 (默认)" },
  { vcn: "x4_lingxiaoyu_assist", name: "聆小瑜" },
  { vcn: "x4_yuexiaoni_assist", name: "悦小妮" },
  { vcn: "x4_yezi", name: "小露" },
  { vcn: "x4_mingge", name: "天明" },
  { vcn: "x4_chaoge", name: "超哥" },
  { vcn: "x4_lingxiaoyue_oral", name: "聆小玥" },
  { vcn: "x4_lingyuyan_oral", name: "聆玉言" },
  { vcn: "x4_lingfeiyi_oral", name: "聆飞逸" },
  { vcn: "x4_lingfeizhe_oral", name: "聆飞哲" }
];

const storedBgIndex = localStorage.getItem('avatar_bg_index');
const storedAvatarId = localStorage.getItem('avatar_id');
const storedVoiceId = localStorage.getItem('avatar_voice_id');

const currentBgIndex = ref(storedBgIndex ? parseInt(storedBgIndex, 10) : 0);
const currentAvatarId = ref(storedAvatarId || avatarsList[0].id);
const currentVoiceId = ref(storedVoiceId || voicesList[0].vcn);

const getAvatarRuntimeSnapshot = () => ({
  avatarId: currentAvatarId.value,
  voiceId: currentVoiceId.value,
  backgroundIndex: currentBgIndex.value,
  backgroundExists: Boolean(backgrounds[currentBgIndex.value]),
  backgroundDataLength: backgrounds[currentBgIndex.value]?.length || 0,
  storedAvatarId,
  storedVoiceId,
});
const isSettingsVisible = ref(false);

const applySettings = () => {
  logAvatarStep('settings:apply', getAvatarRuntimeSnapshot());
  localStorage.setItem('avatar_bg_index', currentBgIndex.value.toString());
  localStorage.setItem('avatar_id', currentAvatarId.value);
  localStorage.setItem('avatar_voice_id', currentVoiceId.value);
  isSettingsVisible.value = false;
  ElMessage.success('正在重新应用数字人外观配置...');
  isAvatarReady.value = false;
  isLoading.value = true;
  isPlaying.value = false;
  resetAvatarRuntime();
  setTimeout(() => { initDigitalHuman(); }, 500);
};

const props = defineProps<{
  latestAiMessage?: string;
  isAiGenerating?: boolean;
  initialAuthInfo?: AvatarAuthInfo | null;
  authInfoLoading?: boolean;
}>();

const emit = defineEmits(['collapse']);

const AVATAR_HEARTBEAT_INTERVAL = 25000;
const AVATAR_RECONNECT_BASE_DELAY = 3000;
const AVATAR_RECONNECT_MAX_DELAY = 30000;
const AVATAR_RECONNECT_MAX_ATTEMPTS = 3;
const AVATAR_DEBUG_PREFIX = '[AvatarDebug]';

const redactAvatarUrl = (url: string) => {
  if (!url) return '';
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.searchParams.has('authorization')) {
      parsedUrl.searchParams.set('authorization', '***redacted***');
    }
    return parsedUrl.toString();
  } catch (error) {
    return url.replace(/authorization=[^&]+/, 'authorization=***redacted***');
  }
};

const logAvatarStep = (step: string, details?: unknown) => {
  if (details === undefined) {
    console.info(`${AVATAR_DEBUG_PREFIX}[${step}]`);
    return;
  }
  console.info(`${AVATAR_DEBUG_PREFIX}[${step}]`, details);
};

const warnAvatarStep = (step: string, details?: unknown) => {
  if (details === undefined) {
    console.warn(`${AVATAR_DEBUG_PREFIX}[${step}]`);
    return;
  }
  console.warn(`${AVATAR_DEBUG_PREFIX}[${step}]`, details);
};

const getSocketStateName = (state?: number) => {
  switch (state) {
    case WebSocket.CONNECTING:
      return 'CONNECTING';
    case WebSocket.OPEN:
      return 'OPEN';
    case WebSocket.CLOSING:
      return 'CLOSING';
    case WebSocket.CLOSED:
      return 'CLOSED';
    default:
      return 'UNKNOWN';
  }
};

const playerContainer = ref<HTMLElement | null>(null);
const isAvatarReady = ref(false);
const isLoading = ref(true);
const isMuted = ref(true);
const isPlaying = ref(false);
let avatarSocket: WebSocket | null = null;
let playerInstance: any = null;
let isInitializing = false;
let isUnmounted = false;
let isManualSocketClose = false;
let reconnectAttempts = 0;
let avatarHeartbeatTimer: number | null = null;
let avatarReconnectTimer: number | null = null;
let lastAvatarMessageAt = 0;

const avatarAuth = ref<AvatarAuthInfo>({ appId: '', wssUrl: '', sceneId: '' });
const currentSpeechText = ref("您好，我是您的专属学习助理~");

const currentAvatarName = computed(() => {
  const avatar = avatarsList.find(a => a.id === currentAvatarId.value);
  return avatar ? avatar.name.replace(' (默认)', '') : '婉柠';
});

const dispatchAvatarAction = (commandType: string, payloadData: any = {}) => {
  if (!avatarSocket || avatarSocket.readyState !== WebSocket.OPEN) {
    warnAvatarStep('command:skip', {
      commandType,
      socketState: getSocketStateName(avatarSocket?.readyState),
      ready: isAvatarReady.value,
      muted: isMuted.value,
    });
    return;
  }
  const requestObj = {
    header: { app_id: avatarAuth.value.appId, ctrl: commandType, request_id: crypto.randomUUID() },
    ...payloadData
  };
  logAvatarStep('command:send', { commandType, requestId: requestObj.header.request_id });
  avatarSocket.send(JSON.stringify(requestObj));
};

const destroyAvatarPlayer = () => {
  if (playerInstance && typeof playerInstance.destroy === 'function') {
    logAvatarStep('player:destroy');
    playerInstance.destroy();
  }
  playerInstance = null;
};

const stopAvatarHeartbeat = () => {
  if (avatarHeartbeatTimer !== null) {
    clearInterval(avatarHeartbeatTimer);
    avatarHeartbeatTimer = null;
  }
};

const clearAvatarReconnect = () => {
  if (avatarReconnectTimer !== null) {
    clearTimeout(avatarReconnectTimer);
    avatarReconnectTimer = null;
  }
};

const closeAvatarSocket = () => {
  if (!avatarSocket) return;
  logAvatarStep('socket:manual-close', { state: getSocketStateName(avatarSocket.readyState) });
  isManualSocketClose = true;
  avatarSocket.close();
  avatarSocket = null;
  stopAvatarHeartbeat();
};

const resetAvatarRuntime = () => {
  closeAvatarSocket();
  destroyAvatarPlayer();
  isAvatarReady.value = false;
  isPlaying.value = false;
};

const scheduleAvatarReconnect = (reason = 'connection lost') => {
  if (isUnmounted || isInitializing || avatarReconnectTimer !== null) return;
  stopAvatarHeartbeat();
  // 连续失败达到上限后停止自动鉴权和重连，用户可重新展开面板再试。
  if (reconnectAttempts >= AVATAR_RECONNECT_MAX_ATTEMPTS) {
    isLoading.value = false;
    console.warn(`[Avatar] reconnect stopped after ${reconnectAttempts} attempts: ${reason}`);
    return;
  }
  clearAvatarReconnect();

  const delay = Math.min(
    AVATAR_RECONNECT_BASE_DELAY * Math.max(1, reconnectAttempts + 1),
    AVATAR_RECONNECT_MAX_DELAY
  );
  reconnectAttempts += 1;
  console.warn(`[Avatar] reconnect scheduled: ${reason}, retry #${reconnectAttempts} in ${delay}ms`);
  avatarReconnectTimer = window.setTimeout(() => {
    avatarReconnectTimer = null;
    initDigitalHuman();
  }, delay);
};

const sendAvatarHeartbeat = () => {
  if (!avatarSocket || avatarSocket.readyState !== WebSocket.OPEN) {
    scheduleAvatarReconnect('heartbeat found socket closed');
    return;
  }

  try {
    avatarSocket.send('ping');
  } catch (error) {
    console.warn('[Avatar] heartbeat failed:', error);
    scheduleAvatarReconnect('heartbeat send failed');
  }
};

const startAvatarHeartbeat = () => {
  stopAvatarHeartbeat();
  lastAvatarMessageAt = Date.now();
  avatarHeartbeatTimer = window.setInterval(sendAvatarHeartbeat, AVATAR_HEARTBEAT_INTERVAL);
};

const handleVisibilityChange = () => {
  if (document.hidden) return;

  const video = playerContainer.value?.querySelector('video');
  const socketUnavailable = !avatarSocket || avatarSocket.readyState !== WebSocket.OPEN;

  if (socketUnavailable) {
    scheduleAvatarReconnect('page resumed with closed avatar socket');
    return;
  }

  sendAvatarHeartbeat();
  if (video) video.play?.().catch(() => undefined);
  playerInstance?.resume?.();
};

const speakText = (text: string) => {
  if (!isAvatarReady.value || isMuted.value) return;
  let cleanText = text
    .replace(/<outline>[\s\S]*?<\/outline>/g, "")
    .replace(/<word>[\s\S]*?<\/word>/g, "")
    .replace(/[#*`_\]\[\-\>]/g, "")
    .replace(/\n+/g, "，")
    .trim();
  if (!cleanText || cleanText.length < 2) return;
  currentSpeechText.value = cleanText;
  isPlaying.value = true;
  const currentAvatar = avatarsList.find(a => a.id === currentAvatarId.value) || avatarsList[0];
  const currentActionIds = currentAvatar.actions;
  const getRandActionStr = () => {
    if (!currentActionIds || currentActionIds.length === 0) return "";
    const actionId = currentActionIds[Math.floor(Math.random() * currentActionIds.length)];
    return `[[action=${actionId}]]`;
  };
  let textWithAction = getRandActionStr();
  const segments = cleanText.split(/([，。！？,!?])/);
  segments.forEach(seg => {
    textWithAction += seg;
    if (/[，。！？,!?]/.test(seg)) { textWithAction += getRandActionStr(); }
  });
  dispatchAvatarAction("text_driver", {
    parameter: { avatar_dispatch: { interactive_mode: 0 }, tts: { vcn: currentVoiceId.value, speed: 50, pitch: 50, volume: 50 } },
    payload: { text: { content: textWithAction } }
  });
};

const stopSpeaking = () => {
  dispatchAvatarAction("reset");
  isPlaying.value = false;
  currentSpeechText.value = "已停止播报...";
  setTimeout(() => { if (!isPlaying.value) currentSpeechText.value = ""; }, 2000);
};

watch(() => props.latestAiMessage, (newVal) => {
  if (newVal && isAvatarReady.value && !isMuted.value) { speakText(newVal); }
});

watch(() => props.initialAuthInfo, (authInfo) => {
  if (!authInfo?.wssUrl || isAvatarReady.value || isInitializing) return;
  avatarAuth.value = authInfo;
  connectXfWebSocket();
}, { immediate: true });

watch(() => props.authInfoLoading, (loading) => {
  if (loading === false && !props.initialAuthInfo?.wssUrl && !isAvatarReady.value) {
    initDigitalHuman();
  }
});

const initDigitalHuman = async () => {
  if (isInitializing || isUnmounted) {
    warnAvatarStep('auth:skip', { isInitializing, isUnmounted });
    return;
  }
  isInitializing = true;
  clearAvatarReconnect();
  try {
    isLoading.value = true;
    logAvatarStep('auth:start', getAvatarRuntimeSnapshot());
    const response: any = await getAvatarAuthInfo();
    const result = response?.data || response || {};
    const authData: Partial<AvatarAuthInfo> = result?.wssUrl ? result : (result?.data || {});
    if (authData && authData.wssUrl) {
      avatarAuth.value = {
        appId: authData.appId || '',
        wssUrl: authData.wssUrl || '',
        sceneId: authData.sceneId || ''
      };
      logAvatarStep('auth:success', {
        appId: avatarAuth.value.appId,
        sceneId: avatarAuth.value.sceneId,
        wssUrl: redactAvatarUrl(avatarAuth.value.wssUrl),
      });
      connectXfWebSocket();
    } else {
      warnAvatarStep('auth:empty', { response });
      ElMessage.error('获取虚拟人鉴权失败：返回数据为空');
      isLoading.value = false;
    }
  } catch (error: any) {
    warnAvatarStep('auth:error', error);
    ElMessage.error('无法连接视频渲染服务: ' + (error?.message || ''));
    isLoading.value = false;
  } finally {
    isInitializing = false;
  }
};

const connectXfWebSocket = () => {
  if (isUnmounted) {
    warnAvatarStep('socket:skip', { reason: 'component unmounted' });
    return;
  }
  if (!avatarAuth.value.wssUrl) {
    warnAvatarStep('socket:skip', { reason: 'missing wssUrl' });
    isLoading.value = false;
    return;
  }
  closeAvatarSocket();
  const requestId = crypto.randomUUID();
  logAvatarStep('socket:connect', { requestId, wssUrl: redactAvatarUrl(avatarAuth.value.wssUrl), ...getAvatarRuntimeSnapshot() });
  avatarSocket = new WebSocket(avatarAuth.value.wssUrl);
  isManualSocketClose = false;
  avatarSocket.onopen = () => {
    logAvatarStep('socket:open', { requestId, readyState: getSocketStateName(avatarSocket?.readyState) });
    startAvatarHeartbeat();
    const startCmd = {
      header: { app_id: avatarAuth.value.appId, request_id: requestId, ctrl: "start", scene_id: avatarAuth.value.sceneId },
      parameter: {
        avatar: { stream: { protocol: "webrtc", fps: 25, bitrate: 2000, alpha: 0 }, avatar_id: currentAvatarId.value, width: 720, height: 1280 },
        tts: { vcn: currentVoiceId.value, speed: 50, pitch: 50, volume: 50 }
      },
      payload: { background: { data: backgrounds[currentBgIndex.value] } }
    };
    logAvatarStep('start:send', {
      requestId,
      header: startCmd.header,
      avatar: startCmd.parameter.avatar,
      tts: startCmd.parameter.tts,
      background: {
        index: currentBgIndex.value,
        exists: Boolean(backgrounds[currentBgIndex.value]),
        dataLength: backgrounds[currentBgIndex.value]?.length || 0,
      },
    });
    avatarSocket?.send(JSON.stringify(startCmd));
  };
  avatarSocket.onmessage = (event) => {
    lastAvatarMessageAt = Date.now();
    let res: any;
    try {
      res = JSON.parse(event.data);
    } catch (error) {
      if (event.data === 'pong') {
        logAvatarStep('heartbeat:pong');
        return;
      }
      if (event.data === 'ping') {
        logAvatarStep('heartbeat:ping');
        avatarSocket?.send('pong');
        return;
      }
      warnAvatarStep('message:parse-error', { data: event.data, error });
      return;
    }
    if (res.header && res.header.code !== 0) {
      if (res.header.ctrl === 'heartbeat') return;
      warnAvatarStep('message:command-failed', res.header);
      return;
    }
    const payload = res.payload;
    if (payload && payload.avatar) {
      logAvatarStep('message:avatar', {
        code: res.header?.code,
        message: res.header?.message,
        sid: res.header?.sid,
        eventType: payload.avatar.event_type,
        errorCode: payload.avatar.error_code,
        errorMessage: payload.avatar.error_message,
        hasStreamUrl: Boolean(payload.avatar.stream_url),
      });
      if (payload.avatar.event_type === 'stream_info') {
        // 收到可播放的视频流后才清零失败次数，避免连接刚建立就断开时无限鉴权。
        reconnectAttempts = 0;
        logAvatarStep('stream:info', {
          sid: res.header?.sid,
          streamUrl: payload.avatar.stream_url,
          streamExtend: payload.avatar.stream_extend,
        });
        startPlayVideo(payload.avatar.stream_url, res.header.sid, payload.avatar.stream_extend);
      }
      if (payload.avatar.event_type === 'driver_status' && res.payload.avatar.vmr_status === 2) { isPlaying.value = false; currentSpeechText.value = "静候您的指令..."; }
    }
  };
  avatarSocket.onerror = (event) => {
    warnAvatarStep('socket:error', { event, readyState: getSocketStateName(avatarSocket?.readyState) });
  };
  avatarSocket.onclose = (event) => {
    stopAvatarHeartbeat();
    if (avatarSocket && avatarSocket !== event.currentTarget) return;
    avatarSocket = null;
    if (isManualSocketClose || isUnmounted) {
      isManualSocketClose = false;
      return;
    }
    warnAvatarStep('socket:close', { code: event.code, reason: event.reason, wasClean: event.wasClean });
    scheduleAvatarReconnect(`socket closed: ${event.code}`);
  };
};

const startPlayVideo = (streamUrl: string, sid: string, streamExtend?: { appid?: string; user_sign?: string }) => {
  logAvatarStep('player:start', { sid, streamUrl, hasStreamExtend: Boolean(streamExtend), hasContainer: Boolean(playerContainer.value) });
  if (!playerContainer.value) {
    warnAvatarStep('player:skip', { reason: 'missing container', sid, streamUrl });
    return;
  }
  destroyAvatarPlayer();
  playerInstance = new RTCPlayer();
  playerInstance.on("playing", () => { logAvatarStep('player:playing', { sid, streamUrl }); isLoading.value = false; isAvatarReady.value = true; });
  playerInstance.on("error", (e: any) => { warnAvatarStep('player:error', e); });
  playerInstance.on("not-allowed", () => { warnAvatarStep('player:not-allowed'); isMuted.value = true; });
  playerInstance.playerType = 6;
  playerInstance.stream = {
    sid: sid,
    streamUrl: streamUrl,
    ...(streamExtend?.user_sign ? { userSign: streamExtend.user_sign } : {}),
    ...(streamExtend?.appid ? { appId: streamExtend.appid } : {}),
  };
  playerInstance.videoSize = { width: 720, height: 1280 };
  playerInstance.container = playerContainer.value;
  playerInstance.play();
};

const toggleAudio = () => {
  if (!playerInstance) return;
  const video = playerContainer.value?.querySelector('video');
  if (isMuted.value) {
    if (video) video.muted = false;
    playerInstance.resume();
    isMuted.value = false;
    speakText("您好，现在我能说话了");
  } else {
    stopSpeaking();
    if (video) video.muted = true;
    isMuted.value = true;
  }
};

onMounted(() => {
  isUnmounted = false;
  document.addEventListener('visibilitychange', handleVisibilityChange);
  if (props.initialAuthInfo?.wssUrl) return;
  if (props.authInfoLoading) return;
  initDigitalHuman();
});
onBeforeUnmount(() => {
  isUnmounted = true;
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  clearAvatarReconnect();
  resetAvatarRuntime();
});
</script>

<template>
  <aside class="assistant-panel glass-panel animate-slide-up" style="animation-delay: 0.05s">
    <div class="digital-human-premium-stage">
      <div class="stage-spotlight"></div>
      <div class="identity-intro-card animate-fade-in" :class="{'is-active': isPlaying}">
        <div class="identity-header">
           <div class="identity-icon" :class="{'pulse-scale': isPlaying}">
             <el-icon v-if="!isPlaying"><MagicStick /></el-icon>
             <div v-else class="vibrate-bars"><span></span><span></span><span></span></div>
           </div>
           <div class="identity-title-info">
             <div class="title-row">
               <h3>知序 · {{ currentAvatarName }}</h3>
               <span v-if="isPlaying" class="speaking-badge">正在讲解...</span>
             </div>
             <span class="p-type-tag">3D AI 学习陪伴助手</span>
           </div>
        </div>
        <div class="identity-body">
          <p class="identity-desc">您的专属 3D 学习助理，会结合学习空间、今日任务和学情证据陪您高效推进。</p>
          <div class="capability-chips">
            <span class="cap-chip">任务引导</span>
            <span class="cap-chip">知识讲解</span>
            <span class="cap-chip">错题复盘</span>
          </div>
        </div>
      </div>
      <div class="avatar-3d-container">
        <div class="avatar-controls">
           <button class="ctrl-btn" @click="toggleAudio" :class="{ 'active': !isMuted }">
              <svg v-if="!isMuted" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              <svg v-else viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
              {{ isMuted ? '开启语音' : '已播音' }}
           </button>
           <div class="avatar-controls-right">
             <el-popover placement="bottom-end" :width="280" trigger="click" v-model:visible="isSettingsVisible" popper-class="premium-settings-popover">
               <template #reference>
                 <button class="icon-ctrl-btn" title="数字人形象设置"><el-icon><Setting /></el-icon></button>
               </template>
               <div class="avatar-settings-content">
               <div class="settings-header">
                 <div class="settings-header-icon"><el-icon><MagicStick /></el-icon></div>
                 <div class="settings-header-text"><h4>数字人形象设置</h4><p>随时切换您的云端专属助理</p></div>
               </div>
               <div class="settings-body">
                 <div class="setting-item-premium"><span class="setting-label">背景环境</span><el-select v-model="currentBgIndex" class="setting-select-premium" :teleported="false"><el-option v-for="(bg, idx) in backgrounds" :key="idx" :label="'场景 ' + (idx + 1)" :value="idx" /></el-select></div>
                 <div class="setting-item-premium"><span class="setting-label">专属人像</span><el-select v-model="currentAvatarId" class="setting-select-premium" :teleported="false"><el-option v-for="avatar in avatarsList" :key="avatar.id" :label="avatar.name" :value="avatar.id" /></el-select></div>
                 <div class="setting-item-premium"><span class="setting-label">发音音色</span><el-select v-model="currentVoiceId" class="setting-select-premium" :teleported="false"><el-option v-for="voice in voicesList" :key="voice.vcn" :label="voice.name" :value="voice.vcn" /></el-select></div>
               </div>
               <div class="settings-footer"><el-button color="#6366f1" class="apply-premium-btn" @click="applySettings">应用并重启配置</el-button></div>
             </div>
             </el-popover>
             <button class="icon-ctrl-btn custom-collapse-btn" title="收起数字人" @click="emit('collapse')"><el-icon><Fold /></el-icon></button>
           </div>
        </div>
        <div class="rtc-player-container" ref="playerContainer" :class="{'is-ready': isAvatarReady}">
            <div class="human-loading" v-if="isLoading"><div class="human-spinner"></div><span>唤醒云端助教中...</span></div>
        </div>
      </div>
      <div class="speech-bubble-floating" v-if="isAvatarReady && currentSpeechText && !isMuted && isPlaying">
        <div class="floating-text-wrap"><span class="quote-start">"</span>{{ currentSpeechText }}<span class="quote-end">"</span></div>
      </div>
      <div class="stage-footer">
        <div class="status-indicator"><span class="status-dot" :class="{'active': isAvatarReady}"></span>{{ isAvatarReady ? '在线 实时驱动' : '正在唤醒' }}</div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.assistant-panel { flex: 0 0 280px; width: 280px; display: flex !important; flex-direction: column; overflow: hidden !important; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
.glass-panel { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(40px); border-radius: 20px; border: 1px solid rgba(200, 210, 224, 0.6); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04), 0 2px 10px rgba(0, 0, 0, 0.02), inset 0 0 0 1px rgba(255, 255, 255, 0.8); display: flex; flex-direction: column; overflow: hidden; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); z-index: 1; }
.avatar-settings-content { display: flex; flex-direction: column; }
.settings-header { display: flex; align-items: center; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; margin-bottom: 16px; }
.settings-header-icon { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #eef2ff, #e0e7ff); color: #6366f1; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.settings-header-text h4 { margin: 0 0 2px 0; font-size: 15px; font-weight: 700; color: #1e293b; }
.settings-header-text p { margin: 0; font-size: 11px; color: #64748b; }
.setting-item-premium { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.setting-label { font-size: 13px; color: #475569; font-weight: 500; }
.setting-select-premium { width: 140px; }
.settings-footer { margin-top: 8px; padding-top: 16px; border-top: 1px solid #f1f5f9; display: flex; justify-content: center; }
.apply-premium-btn { width: 100%; border-radius: 8px; font-weight: 600; letter-spacing: 0.5px; }
:deep(.premium-settings-popover) { border-radius: 16px !important; padding: 20px !important; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.15) !important; border: 1px solid rgba(226, 232, 240, 0.8) !important; }
.icon-ctrl-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(8px); color: #555; cursor: pointer; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); transition: all 0.2s ease; }
.icon-ctrl-btn:hover { background: white; color: #409eff; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12); }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.animate-slide-up { opacity: 0; animation: slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.digital-human-premium-stage { padding: 24px 16px 16px; position: relative; background: radial-gradient(circle at center, rgba(99, 102, 241, 0.12) 0%, transparent 85%); display: flex; flex-direction: column; align-items: center; height: 100%; gap: 16px; }
.identity-intro-card { width: 100%; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px); border-radius: 16px; padding: 16px; border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 8px 32px rgba(99, 102, 241, 0.08); z-index: 10; transition: all 0.3s ease; }
.identity-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.identity-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
.identity-title-info { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.identity-title-info h3 { margin: 0; font-size: 15px; font-weight: 800; color: #1e293b; letter-spacing: -0.01em; line-height: 1; }
.p-type-tag { font-size: 10px; color: #6366f1; font-weight: 700; background: rgba(99, 102, 241, 0.1); padding: 2px 6px; border-radius: 4px; }
.identity-desc { font-size: 12px; color: #64748b; line-height: 1.6; margin: 0 0 12px 0; }
.capability-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.cap-chip { font-size: 10px; color: #8b5cf6; background: white; border: 1px solid rgba(139, 92, 246, 0.2); padding: 3px 8px; border-radius: 20px; font-weight: 600; }
.stage-spotlight { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); width: 300px; height: 300px; background: radial-gradient(circle, rgba(165, 180, 252, 0.3) 0%, transparent 70%); z-index: 0; filter: blur(40px); pointer-events: none; }
.avatar-3d-container { width: 100%; flex: 1; position: relative; z-index: 5; display: flex; justify-content: center; align-items: center; margin-top: -20px; }
.rtc-player-container { width: 100%; height: 480px; position: relative; overflow: hidden; border-radius: 24px; background: transparent; }
:deep(.rtc-player-container video) { width: 100% !important; height: 100% !important; object-fit: cover !important; border-radius: 24px; mask-image: linear-gradient(to bottom, black 80%, transparent 100%); }
.speech-bubble-floating { position: absolute; bottom: 80px; left: 20px; right: 20px; z-index: 20; animation: floatUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.floating-text-wrap { background: rgba(30, 41, 59, 0.85); backdrop-filter: blur(12px); color: white; padding: 12px 18px; border-radius: 16px; font-size: 13px; line-height: 1.5; text-align: center; box-shadow: 0 12px 24px rgba(0,0,0,0.2); position: relative; font-weight: 500; max-height: 100px; overflow-y: auto; }
.floating-text-wrap::-webkit-scrollbar { width: 4px; }
.floating-text-wrap::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.3); border-radius: 4px; }
.quote-start, .quote-end { font-family: serif; font-size: 20px; opacity: 0.5; display: inline-block; vertical-align: middle; line-height: 1; }
@keyframes floatUp { from { opacity: 0; transform: translateY(20px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
.stage-footer { width: 100%; display: flex; justify-content: center; z-index: 10; }
.status-indicator { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: #94a3b8; background: white; padding: 6px 12px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: #cbd5e1; }
.status-dot.active { background: #22c55e; box-shadow: 0 0 8px #22c55e; animation: pulse 2s infinite; }
@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
.avatar-controls { position: absolute; top: 16px; left: 16px; right: 16px; z-index: 15; display: flex; justify-content: space-between; align-items: flex-start; pointer-events: none; }
.avatar-controls > * { pointer-events: auto; }
.avatar-controls-right { display: flex; gap: 8px; }
.ctrl-btn { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.9); padding: 6px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; color: #475569; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: all 0.2s ease; }
.ctrl-btn:hover { background: white; transform: scale(1.05); }
.ctrl-btn.active { color: #6366f1; background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.2); }
.identity-intro-card.is-active { border-color: rgba(99, 102, 241, 0.4); background: rgba(255, 255, 255, 0.9); box-shadow: 0 12px 40px rgba(99, 102, 241, 0.15); }
.title-row { display: flex; align-items: center; gap: 8px; }
.speaking-badge { font-size: 10px; background: #22c55e; color: white; padding: 1px 6px; border-radius: 4px; font-weight: 700; animation: fadeInOut 1.5s infinite; }
@keyframes fadeInOut { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
.vibrate-bars { display: flex; align-items: flex-end; gap: 2px; height: 14px; }
.vibrate-bars span { display: inline-block; width: 2px; background: white; border-radius: 1px; }
.vibrate-bars span:nth-child(1) { height: 60%; animation: vibrate 0.5s infinite; }
.vibrate-bars span:nth-child(2) { height: 100%; animation: vibrate 0.7s infinite; }
.vibrate-bars span:nth-child(3) { height: 40%; animation: vibrate 0.6s infinite; }
@keyframes vibrate { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.5); } }
.pulse-scale { animation: pulseScale 2s infinite ease-in-out; }
@keyframes pulseScale { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
.human-loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 140px; height: 140px; background: rgba(255, 255, 255, 0.7); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; font-size: 12px; color: #6366f1; font-weight: 700; border-radius: 70px; backdrop-filter: blur(10px); text-align: center; padding: 20px; }
.human-spinner { width: 32px; height: 32px; border: 4px solid rgba(99, 102, 241, 0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px; }
</style>
