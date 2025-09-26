/**
 * mihomo 代理配置覆写脚本
 *
 * 自动读取订阅节点，并生成一套包含智能分流、自动测速和丰富自定义选项的全新配置。
 *
 * ==================== 📖 快速上手 ====================
 * 
 * 1. 在 mihomo GUI的“覆写”或“预处理”设置中，粘贴并保存此脚本。
 * 2. 在需要应用的订阅上，选择使用此覆写。
 *
 * ==================== ⚙️ 自定义配置 ====================
 *
 * 所有可配置项均在下方的“用户配置区”。
 *
 * - 智能分流:
 *   - 脚本已内置“国内直连”、“被墙代理”、“国外兜底”三大核心规则。
 *   - 如需修正分流，请修改 `PROXY_RULES` 中的 `自定义代理` 和 `自定义直连` 分组，它们的优先级最高。
 *
 * - 策略分组:
 *   - `PROXY_RULES`: 定义所有“应用策略组”(如 AIGC, 媒体)。数组顺序即为最终排序。
 *     - 高级用法: 在分组对象中添加 `defaultProxy: "节点名"` 可指定默认节点。
 *     - 高级用法: 添加 `overrideProxies: ["节点1", ...]` 可完全覆盖节点列表 (例如“广告拦截”分组)。
 *   - `EXCLUDE_KEYWORDS`: 配置节点黑名单，自动过滤“流量”、“到期”等无效节点。
 *
 * - 基础配置:
 *   - `GROUP_ICONS`: 自定义各分组的图标。
 *   - `CONFIG`: 配置测试URL、延迟等基础参数。
 *   - `DNS_CONFIG`: 自定义DNS服务器。
 *
 */

// ==================== 用户配置区（可自由修改） ====================

/**
 * 🎨 代理组图标配置
 * 
 * - 将代理组名称映射到图标URL
 * - 图标源推荐：https://github.com/Koolson/Qure
 * - 如果代理组名称未在此处定义，则不显示图标
 */
const GROUP_ICONS = {
    // 基础分流
    "直连-国内网站": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/China.png",
    "兜底-国外网站": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png",
    "代理-被墙网站": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Proxy.png",
    "手动选择": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Static.png", // Corrected: Hand.png -> Static.png
    "AUTO": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Auto.png",
    "ET AUTO": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Area.png",

    // 自定义规则
    "自定义代理": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Star.png",
    "自定义直连": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Direct.png", // Corrected: Doc.png -> Direct.png

    // 服务规则
    "广告拦截": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/AdBlack.png", // Corrected: AdBlock.png -> AdBlack.png
    "AIGC": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Bot.png",
    "媒体": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/ForeignMedia.png",
    "社交": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png",
    "开发": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/GitHub.png",
    // "OneDrive": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/OneDrive.png",
    "Microsoft": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Microsoft.png",
    "Steam": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Steam.png",
    "Google": "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Google_Search.png",
};


/**
 * 基础配置选项
 * 
 * 🔧 如何自定义：
 * - testUrl：用于测试节点延迟的URL，建议使用稳定的轻量级接口
 * - testInterval：自动测试间隔，单位秒，建议300-600秒
 * - tolerance：延迟容差，单位毫秒，用于自动选择时的延迟判断
 */
const CONFIG = {
    // 测试连接URL（建议使用Google的204接口或其他稳定接口）
    testUrl: "https://www.gstatic.com/generate_204",
    
    // 自动测试间隔 (秒) - 太频繁会增加流量消耗
    testInterval: 300,
    
    // 自动选择容差 (毫秒) - 延迟差异在此范围内认为相同
    tolerance: 20
};


/**
 * 🚫 节点排除关键字 (黑名单)
 * 
 * - 节点名称包含以下任意关键字时，该节点将被自动过滤，不会出现在任何分组中
 * - 用于排除机场订阅中常见的“剩余流量”、“到期时间”等无效信息节点
 */
const EXCLUDE_KEYWORDS = [
    '流量', '到期', '官网', '订阅', '频道', '重置',
    'Expire', 'Traffic', 'Website', 'Subscription', 'Channel', 'Reset'
];


const SAVED_RULES = [
    "RULE-SET,cncidr,DIRECT,no-resolve",
    "RULE-SET,direct,DIRECT",
    "GEOSITE,gfw,代理-被墙网站",
    "GEOIP,CN,直连-国内网站",
    "MATCH,兜底-国外网站"
]


/**
 * 🎛️ 代理规则配置 - 核心自定义区域
 * 
 * 📖 字段说明：
 * - name: 规则名称，将作为代理组名称显示
 * - preferProxy: 代理优先级 (true=代理优先, false=直连优先)
 * - urls: 规则集链接，可以是单个URL或URL数组，从GitHub等获取最新规则
 * - payload: 自定义规则内容，直接写规则，设置后urls将被忽略
 * - extraProxies: 额外代理选项，如"REJECT"用于广告拦截
 * 
 * 🔧 如何添加新服务：
 * 1. 在适当位置添加新的规则对象
 * 2. 设置name（显示名称）和preferProxy（代理策略）
 * 3. 选择规则来源：使用urls（在线规则集）或payload（自定义规则）
 * 4. 位置很重要：越具体的服务应该放在越前面
 * 
 * 📋 规则格式示例：
 * - DOMAIN-SUFFIX,example.com  （匹配example.com及其子域名）
 * - DOMAIN,api.example.com     （精确匹配域名）
 * - DOMAIN-KEYWORD,google      （域名包含关键词）
 * - IP-CIDR,192.168.1.0/24     （IP段匹配）
 * 
 * ⚠️  注意事项：
 * - 规则按顺序匹配，第一个匹配的规则生效
 * - preferProxy影响代理组内的选择顺序，不影响规则匹配
 * - 建议先添加到最后测试，确认无误后调整位置
 */
/**
 * 代理规则配置 - 按优先级排序
 * 规则处理顺序：特定服务 → 通用分类
 * 注意：越具体的规则应该放在越前面，避免被通用规则覆盖
 */
const PROXY_RULES = [
    // 顺序已按用户要求重新排列
    {
        name: "自定义代理", 
        preferProxy: true,
        payload: [
            "DOMAIN-SUFFIX,v2ex.com",
            "DOMAIN-SUFFIX,nodeseek.com"
        ],
        defaultProxy: "手动选择"
    },
    {
        name: "自定义直连", 
        preferProxy: false,
        payload: [
            "DOMAIN-SUFFIX,mnapi.com",
            "DOMAIN-SUFFIX,ieee.org",
            "DOMAIN-SUFFIX,anrunnetwork.com",
            "DOMAIN-SUFFIX,apifox.com",
            "DOMAIN-SUFFIX,crond.dev",
            "DOMAIN-SUFFIX,libvio.fun",
            "DOMAIN-SUFFIX,linux.do",
            "DOMAIN-SUFFIX,iyf.lv",
            "DOMAIN-SUFFIX,cycity.pro",
            "DOMAIN-SUFFIX,cycani.org",
            "IP-CIDR,223.113.52.0/22,no-resolve",
            "DOMAIN-SUFFIX,rzlnb.top"
        ]
    },
    {
        name: "AIGC",
        preferProxy: true,
        urls: [
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Claude/Claude.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/OpenAI/OpenAI.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Gemini/Gemini.yaml"
        ],
        payload: [
            "DOMAIN-SUFFIX,cursor.com",
            "DOMAIN-SUFFIX,cursor.sh",
            "DOMAIN-SUFFIX,cursor-cdn.com",
            "DOMAIN-SUFFIX,cursorapi.com",
            "DOMAIN-SUFFIX,windsurf.com",
            "DOMAIN-SUFFIX,codeium.com",
            "DOMAIN-SUFFIX,trae.ai",
            "DOMAIN-SUFFIX,byteoversea.com",
            "DOMAIN-SUFFIX,trae-api-sg.mchost.guru",
            "DOMAIN-SUFFIX,lf3-static.bytednsdoc.com",
            "DOMAIN-SUFFIX,bytegate-sg.byteintlapi.com",
            "DOMAIN-SUFFIX,abtestvm-sg.bytedance.com",
            "DOMAIN-SUFFIX,tron-sg.bytelemon.com",
            "DOMAIN-SUFFIX,sf16-short-sg.bytedapm.com",
            "DOMAIN-SUFFIX,trae.com.cn",
            "DOMAIN-SUFFIX,tron.jiyunhudong.com",
            "DOMAIN-SUFFIX,starling.zijieapi.com",
            "DOMAIN-SUFFIX,augmentcode.com",
            "DOMAIN-SUFFIX,anthropic.com",
            "DOMAIN-SUFFIX,claude.ai",
            "DOMAIN-SUFFIX,chatgpt.com",
            "DOMAIN-SUFFIX,oaistatic.com",
            "DOMAIN-SUFFIX,oaiusercontent.com",
            "DOMAIN-SUFFIX,perplexity.ai",
            "DOMAIN-SUFFIX,character.ai",
            "DOMAIN-SUFFIX,c.ai",
            "DOMAIN-SUFFIX,janitor.ai",
            "DOMAIN-SUFFIX,huggingface.co",
            "DOMAIN-SUFFIX,replicate.com",
            "DOMAIN-SUFFIX,runpod.io",
            "DOMAIN-SUFFIX,together.ai",
            "DOMAIN-SUFFIX,fireworks.ai",
            "DOMAIN-SUFFIX,poe.com",
            "DOMAIN-SUFFIX,midjourney.com",
            "DOMAIN-SUFFIX,discord.com",
            "DOMAIN-SUFFIX,stability.ai",
            "DOMAIN-SUFFIX,leonardo.ai",
            "DOMAIN-SUFFIX,civitai.com"
        ],
        defaultProxy: "US AUTO"
    },
    {
        name: "媒体", 
        preferProxy: true, 
        urls: [
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/YouTube/YouTube.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/YouTubeMusic/YouTubeMusic.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Netflix/Netflix_No_Resolve.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TikTok/TikTok_No_Resolve.yaml"
        ]
    },
    {
        name: "社交", 
        preferProxy: true, 
        urls: [
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Twitter/Twitter_No_Resolve.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Facebook/Facebook_No_Resolve.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Telegram/Telegram_No_Resolve.yaml"
        ]
    },
    {
        name: "开发",
        preferProxy: true,
        urls: [
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/GitHub/GitHub.yaml",
            "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Cloudflare/Cloudflare_No_Resolve.yaml"
        ]
    },
    { 
        name: "Google", 
        preferProxy: true, 
        urls: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Google/Google_No_Resolve.yaml" 
    },
    { 
        name: "Microsoft", 
        preferProxy: false, 
        urls: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Microsoft/Microsoft_No_Resolve.yaml" 
    },
    { 
        name: "Steam", 
        preferProxy: false, 
        urls: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Steam/Steam_No_Resolve.yaml",
        defaultProxy: "1倍便宜货"
    },
    { 
        name: "广告拦截", 
        preferProxy: false, 
        urls: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AdvertisingLite/AdvertisingLite_Classical.yaml",
        overrideProxies: ["REJECT", "DIRECT"]
    },
];

/**
 * DNS 配置
 * 可根据需要修改DNS服务器
 * 
 * DNS选择策略：
 * 1. 国内直连服务 → 使用国内DNS，避免污染
 * 2. 被墙服务 → 使用国外DNS，确保正确解析  
 * 3. 通用国外服务 → 使用fallback机制，智能选择
 * 
 * 重要：DNS配置应与代理规则保持一致，避免DNS泄露
 */
const DNS_CONFIG = {
    // 国际可信DNS (加密)
    trustDnsList: [
        "tls://8.8.8.8", "tls://1.1.1.1", "tls://9.9.9.9",
        "https://8.8.8.8/dns-query", "https://1.1.1.1/dns-query"
    ],
    
    // 默认DNS (用于解析域名服务器，必须为IP，可加密)
    defaultDNS: ["tls://1.12.12.12", "tls://223.5.5.5"],
    
    // 中国大陆DNS服务器
    cnDnsList: [
        '119.29.29.29',                    // Tencent Dnspod
        '223.5.5.5',                       // Ali DNS
        '1.12.12.12',                      // China Telecom
        "114.114.114.114",
    ],
    
    // DNS隐私保护过滤器
    fakeIpFilter: [
        "+.lan", "+.local",
        // Windows网络连接检测
        "+.msftconnecttest.com", "+.msftncsi.com",
        // QQ/微信快速登录检测
        "localhost.ptlogin2.qq.com", "localhost.sec.qq.com",
        "localhost.work.weixin.qq.com",
    ],
    
    // 指定域名使用的DNS服务器
    // 格式: "域名或geosite": DNS服务器
    // 注意：确保DNS选择与代理规则匹配，避免DNS泄露
    nameserverPolicy: {
        "geosite:private": "system",
        // 国内服务使用国内DNS（与DIRECT代理规则匹配）
        "geosite:cn,steam@cn,category-games@cn": 'cnDnsList',
        // Microsoft和Apple服务：根据代理规则，如果走DIRECT则使用国内DNS
        "microsoft@cn,apple@cn": 'cnDnsList'
    },
    
    // 需要指定使用国外DNS的域名
    fallbackDomains: [
        "+.azure.com", "+.bing.com", "+.bingapis.com",
        "+.cloudflare.net", "+.docker.com", "+.docker.io",
        "+.facebook.com", "+.github.com", "+.githubusercontent.com",
        "+.google.com", "+.gstatic.com", "+.google.dev",
        "+.googleapis.cn", "+.googleapis.com", "+.googlevideo.com",
        "+.instagram.com", "+.meta.ai", "+.microsoft.com",
        "+.microsoftapp.net", "+.msn.com", "+.openai.com",
        "+.poe.com", "+.t.me", "+.twitter.com",
        "+.x.com", "+.youtube.com",
        // {{ Change: Add - 增加更多AI服务域名，防止DNS泄漏暴露真实位置 }}
        "+.anthropic.com", "+.claude.ai", "+.chatgpt.com",
        "+.gemini.google.com", "+.bard.google.com", "+.ai.google.dev",
        "+.perplexity.ai", "+.character.ai", "+.janitor.ai",
        "+.huggingface.co", "+.replicate.com", "+.runpod.io",
        "+.together.ai", "+.fireworks.ai", "+.deepseek.com",
        "+.moonshot.cn", "+.kimi.moonshot.cn",
        // {{ Change: Add - 添加AI代码工具域名，防止DNS泄漏被检测 }}
        "+.cursor.com", "+.cursor.sh", "+.cursor-cdn.com", "+.cursorapi.com",
        "+.windsurf.com", "+.codeium.com", "+.augmentcode.com",
        "+.trae.ai", "+.byteoversea.com", "+.starling.zijieapi.com",
        "+.midjourney.com", "+.discord.com", "+.stability.ai",
        "+.leonardo.ai", "+.civitai.com"
    ]
};

// ==================== 系统实现区（一般不需要修改） ====================


// 国家/地区代码映射表（支持中英文对照）
const COUNTRY_CODES = {
    // 亚洲
    'CN': ['🇨🇳', '中国', 'China'],
    'HK': ['🇭🇰', '香港', 'Hong Kong'],
    'TW': ['🇹🇼', '台湾', 'Taiwan'],
    'JP': ['🇯🇵', '日本', 'Japan'],
    'KR': ['🇰🇷', '韩国', 'South Korea'],
    'SG': ['🇸🇬', '新加坡', 'Singapore'],
    'IN': ['🇮🇳', '印度', 'India'],
    'TH': ['🇹🇭', '泰国', 'Thailand'],
    'MY': ['🇲🇾', '马来西亚', 'Malaysia'],
    'VN': ['🇻🇳', '越南', 'Vietnam'],
    'PH': ['🇵🇭', '菲律宾', 'Philippines'],
    'ID': ['🇮🇩', '印尼', 'Indonesia'],
    
    // 欧洲
    'GB': ['🇬🇧', '英国', 'United Kingdom'],
    'DE': ['🇩🇪', '德国', 'Germany'],
    'FR': ['🇫🇷', '法国', 'France'],
    'IT': ['🇮🇹', '意大利', 'Italy'],
    'ES': ['🇪🇸', '西班牙', 'Spain'],
    'NL': ['🇳🇱', '荷兰', 'Netherlands'],
    'CH': ['🇨🇭', '瑞士', 'Switzerland'],
    'SE': ['🇸🇪', '瑞典', 'Sweden'],
    
    // 美洲
    'US': ['🇺🇸', '美国', 'United States'],
    'CA': ['🇨🇦', '加拿大', 'Canada'],
    'BR': ['🇧🇷', '巴西', 'Brazil'],
    'MX': ['🇲🇽', '墨西哥', 'Mexico'],
    
    // 大洋洲
    'AU': ['🇦🇺', '澳大利亚', 'Australia'],
    'NZ': ['🇳🇿', '新西兰', 'New Zealand'],
    
    // 其他
    'RU': ['🇷🇺', '俄罗斯', 'Russia'],
    'SA': ['🇸🇦', '沙特', 'Saudi Arabia'],
    'AE': ['🇦🇪', '阿联酋', 'United Arab Emirates']
};

// 有效节点格式验证正则（支持英文代码/中文名称/英文名称）
// 示例匹配: US, 中国, China, 日本, Japan 等
const VALID_PROXY_REGEX = (() => {
    const countryValues = Object.values(COUNTRY_CODES); // 缓存Object.values()结果
    const englishCodes = Object.keys(COUNTRY_CODES);
    const chineseNames = countryValues.map(v => v[0]);
    const englishNames = countryValues.map(v => v[1]);
    
    return new RegExp(
        '(' +
        englishCodes.join('|') + '|' + // 英文代码
        chineseNames.join('|') + '|' + // 中文名称
        englishNames.join('|') + // 英文名称
        ')',
        'i'
    );
})();

// 计费倍数匹配正则（匹配格式如【3x】），未匹配的节点默认按1倍计费
const BILLING_RATE_REGEX = /【(\d+)x】/;

// 构建DNS配置对象
const dns = buildDnsConfig(DNS_CONFIG);

// ==================== 辅助函数部分 ====================

/**
 * 构建DNS配置对象
 * @param {Object} config - DNS配置参数
 * @returns {Object} 完整的DNS配置对象
 */
function buildDnsConfig(config) {
    // 错误处理：验证输入参数
    if (!config || typeof config !== 'object') {
        throw new Error('DNS配置参数无效');
    }
    
    // 性能优化：缓存数组复制结果
    const cnDnsListCopy = config.cnDnsList ? [...config.cnDnsList] : [];
    
    return {
        enable: true,
        listen: ":53",
        ipv6: true,
        "prefer-h3": true,
        "use-hosts": true,
        "use-system-hosts": true,
        "respect-rules": true,
        "enhanced-mode": "fake-ip",
        "fake-ip-range": "198.18.0.1/16",
        "fake-ip-filter": config.fakeIpFilter || [],
        "default-nameserver": config.defaultDNS || [],
        nameserver: config.trustDnsList || [],
        "proxy-server-nameserver": cnDnsListCopy,
        "nameserver-policy": {
            "geosite:private": "system",
            // 与上面的nameserverPolicy保持一致
            "geosite:cn,steam@cn,category-games@cn": cnDnsListCopy,
            "microsoft@cn,apple@cn": cnDnsListCopy,
        },
        fallback: config.trustDnsList || [],
        "fallback-filter": {
            geoip: true,
            "geoip-code": "CN",
            geosite: ["gfw"],
            ipcidr: ["240.0.0.0/4"],
            domain: config.fallbackDomains || []
        }
    };
}

/**
 * 创建规则提供器配置 - 使用对象复用优化性能
 * @param {string} url - 规则集URL
 * @returns {Object} 规则提供器配置对象
 */
function createRuleProviderUrl(url) {
    // 错误处理：验证URL参数
    if (!url || typeof url !== 'string') {
        throw new Error('规则集URL参数无效');
    }
    
    return {
        type: "http",
        interval: 86400,
        behavior: "classical",
        format: "yaml",
        url
    };
}

/**
 * 创建payload对应的规则 - 优化数组操作
 * @param {string|string[]} payload - 规则内容
 * @param {string} name - 规则名称
 * @returns {string[]} 处理后的规则列表
 */
function createPayloadRules(payload, name) {
    // 错误处理：验证输入参数
    if (!payload || !name) {
        throw new Error('payload和name参数不能为空');
    }
    
    const payloads = Array.isArray(payload) ? payload : [payload];
    const len = payloads.length;
    const rules = new Array(len);
    // 性能优化：缓存规范化的名称
    const normalizedName = name.split(",").join("-");
    
    for (let i = 0; i < len; i++) {
        const item = payloads[i];
        if (typeof item !== 'string') {
            console.warn(`跳过无效的payload项: ${item}`);
            continue;
        }
        
        const p = item.split(",");
        let insertPos = p.length;
        
        // 性能优化：避免重复获取最后一个元素
        const last = p[p.length - 1];
        if (last === "no-resolve" || last === "NO-RESOLVE") {
            insertPos--;
        }
        
        p.splice(insertPos, 0, normalizedName);
        rules[i] = p.join(",");
    }
    
    return rules.filter(rule => rule); // 过滤掉undefined项
}

/**
 * 创建代理优先的代理组
 * @param {string} name - 代理组名称
 * @param {string|string[]} addProxies - 额外代理
 * @param {string} testUrl - 测试链接
 * @param {string[]} filteredProxies - 过滤后的代理节点列表
 * @param {string[]} autoSelectGroups - 所有自动选择组名称列表
 * @returns {Object} 代理组配置
 */
function createProxyFirstGroup(name, addProxies, testUrl, autoSelectGroupNames, defaultProxy, overrideProxies) {
    addProxies = addProxies ? (Array.isArray(addProxies) ? addProxies : [addProxies]) : [];
    
    let finalProxies = [];
    if (overrideProxies) {
        finalProxies = overrideProxies;
    } else {
        const defaultList = [...addProxies, ...autoSelectGroupNames, "DIRECT", "手动选择"];
        if (defaultProxy) {
            // 将指定的默认代理移到最前面
            const index = defaultList.indexOf(defaultProxy);
            if (index > -1) {
                defaultList.splice(index, 1);
            }
            finalProxies = [defaultProxy, ...defaultList];
        } else {
            finalProxies = defaultList;
        }
    }

    const group = {
        "name": name,
        "type": "select",
        "proxies": finalProxies,
        "url": testUrl
    };

    if (GROUP_ICONS[name]) {
        group.icon = GROUP_ICONS[name];
    }
    return group;
}

/**
 * 创建直连优先的代理组
 * @param {string} name - 代理组名称
 * @param {string|string[]} addProxies - 额外代理
 * @param {string} testUrl - 测试链接
 * @param {string[]} autoSelectGroupNames - 所有自动选择组名称列表
 * @param {string} defaultProxy - 指定的默认代理
 * @param {string[]} overrideProxies - 完全覆盖的代理列表
 * @returns {Object} 代理组配置
 */
function createDirectFirstGroup(name, addProxies, testUrl, autoSelectGroupNames, defaultProxy, overrideProxies) {
    addProxies = addProxies ? (Array.isArray(addProxies) ? addProxies : [addProxies]) : [];

    let finalProxies = [];
    if (overrideProxies) {
        finalProxies = overrideProxies;
    } else {
        const defaultList = [...addProxies, "DIRECT", ...autoSelectGroupNames, "手动选择"];
        if (defaultProxy) {
            // 将指定的默认代理移到最前面
            const index = defaultList.indexOf(defaultProxy);
            if (index > -1) {
                defaultList.splice(index, 1);
            }
            finalProxies = [defaultProxy, ...defaultList];
        } else {
            finalProxies = defaultList;
        }
    }

    const group = {
        "name": name,
        "type": "select",
        "proxies": finalProxies,
        "url": testUrl
    };

    if (GROUP_ICONS[name]) {
        group.icon = GROUP_ICONS[name];
    }
    return group;
}

/**
 * 过滤有效节点 - 验证节点名称格式
 * 支持以下国家/地区标识格式：
 * 1. 英文代码（如US、HK、JP）
 * 2. 中文名称（如中国、日本、香港）
 * 3. 英文名称（如China、Japan、Hong Kong）
 * @param {Array} proxies - 所有代理节点
 * @returns {Array} 通过验证的有效节点数组
 */
function filterValidProxies(proxies) {
    // 错误处理：验证输入参数
    if (!proxies || !Array.isArray(proxies)) {
        console.warn('代理列表无效，返回空数组');
        return [];
    }

    // {{ Change: Modify - 更新正则以兼容带Emoji的COUNTRY_CODES结构 }}
    const VALID_PROXY_REGEX = (() => {
        // 使用 reduce 和 concat 替代 flatMap，增强兼容性
        const allNames = Object.values(COUNTRY_CODES)
            .map(v => v.slice(1))
            .reduce((acc, val) => acc.concat(val), []); 
            
        const englishCodes = Object.keys(COUNTRY_CODES);
        
        return new RegExp(
            '(' +
            englishCodes.join('|') + '|' + // 英文代码
            allNames.join('|') + // 中文和英文名称
            ')',
            'i'
        );
    })();

    // {{ Change: Add - 创建黑名单正则 }}
    const excludeRegex = new RegExp(EXCLUDE_KEYWORDS.join('|'), 'i');
    
    // 性能优化：使用更高效的过滤逻辑
    const validProxies = [];
    const len = proxies.length;
    
    for (let i = 0; i < len; i++) {
        const proxy = proxies[i];
        if (!proxy || typeof proxy !== 'object') {
            continue;
        }
        
        const proxyName = proxy.name || "";
        // {{ Change: Modify - 增加黑名单过滤条件 }}
        if (VALID_PROXY_REGEX.test(proxyName) && !excludeRegex.test(proxyName)) {
            validProxies.push(proxy);
        }
    }
    
    return validProxies;
}


// 已移除：filterBillingRateProxies 函数，现在直接在 main 函数中统一处理

/**
 * 主函数：生成完整的Clash配置
 * @param {Object} config - 输入配置
 * @returns {Object} 完整的Clash配置
 */
function main(config) {
    // 错误处理：验证输入配置
    if (!config || typeof config !== 'object') {
        throw new Error('配置参数无效');
    }
    
    const { proxies } = config;
    if (!proxies) {
        throw new Error('代理列表不存在');
    }
    
    const testUrl = CONFIG.testUrl;

    // 1. 首先统一过滤所有节点，移除无关项
    const validProxies = filterValidProxies(proxies);
    
    // 错误处理：检查是否有有效代理
    if (validProxies.length === 0) {
        console.warn('警告：没有找到有效的代理节点');
    }
    
    // 2. 处理计费信息
    const billingRateProxies = validProxies.map(proxy => {
        const proxyName = proxy.name || "";
        const match = proxyName.match(BILLING_RATE_REGEX);
        const rate = match ? parseInt(match[1], 10) : 1;
        return {
            name: proxyName,
            rate: rate,
            proxy: proxy
        };
    });
    
    // 3. 获取所有1倍速率节点和其他节点
    const cheapProxies = billingRateProxies.filter(p => p.rate === 1).map(p => p.name);
    const allFilteredProxyNames = billingRateProxies.map(item => item.name);

    // 4. 构建所有基础分组（便宜货、地区、自动、手动等）
    const { coreRoutingGroups, utilityGroups, autoSelectGroupNames } = buildBaseProxyGroups(
        testUrl,
        cheapProxies,
        allFilteredProxyNames
    );

    // 5. 初始化规则和代理组
    const rules = [];
    const serviceGroups = []; // {{ Change: Use a single array to preserve order }}

    // 6. 规则集通用配置 - 统一CDN和格式
    const ruleProviderCommon = {
        type: "http",
        format: "text", // 统一使用text格式匹配.txt文件
        interval: 86400
    };

    // 7. 初始化规则提供器 - 统一使用cdn.jsdelivr.net CDN
    const ruleProviders = {
        reject: {
            ...ruleProviderCommon,
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
            path: "./ruleset/loyalsoldier/reject.yaml"
        },
        cncidr: {
            ...ruleProviderCommon,
            behavior: "ipcidr",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt",
            path: "./ruleset/loyalsoldier/cncidr.yaml"
        },
        direct: {
            ...ruleProviderCommon,
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt",
            path: "./ruleset/loyalsoldier/direct.yaml"
        }
    };

    // 8. 处理代理规则和规则集
    const configLen = PROXY_RULES.length;
    for (let i = 0; i < configLen; i++) {
        const { name, preferProxy, urls, payload, extraProxies, defaultProxy, overrideProxies } = PROXY_RULES[i];

        // {{ Change: Create group and push to the single serviceGroups array }}
        const group = preferProxy
            ? createProxyFirstGroup(name, extraProxies, testUrl, autoSelectGroupNames, defaultProxy, overrideProxies)
            : createDirectFirstGroup(name, extraProxies, testUrl, autoSelectGroupNames, defaultProxy, overrideProxies);
        serviceGroups.push(group);

        // 处理规则
        if (payload) {
            rules.push(...createPayloadRules(payload, name));
        } else if (urls) {
            const urlList = Array.isArray(urls) ? urls : [urls];
            const urlLen = urlList.length;
            for (let j = 0; j < urlLen; j++) {
                const theUrl = urlList[j];
                const iName = `${name}-rule${j !== 0 ? `-${j}` : ''}`;
                ruleProviders[iName] = createRuleProviderUrl(theUrl);
                rules.push(`RULE-SET,${iName},${name}`);
            }
        }
    }

    // 9. 构建最终配置
    return {
        mode: "rule",
        "find-process-mode": "strict",
        "global-client-fingerprint": "chrome",
        "unified-delay": true,
        "tcp-concurrent": true,
        "global-ua": "clash.meta",
        "profile": {
            "store-selected": true,
            "store-fake-ip": true
        },
        "geox-url": {
            geoip: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat",
            geosite: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat",
            mmdb: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country-lite.mmdb",
            asn: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb"
        },
        dns,
        proxies: validProxies, // 使用过滤后的代理列表
        "proxy-groups": [
            ...serviceGroups,       // 第一梯队：应用策略组
            ...utilityGroups,       // 第二梯队：节点池组
            ...coreRoutingGroups    // 第三梯队：核心分流组
        ],
        "rule-providers": ruleProviders,
        rules: [
            "RULE-SET,reject,广告拦截",
            ...rules,
            ...SAVED_RULES
        ]
    };
}

/**
 * 构建基本代理组
 * @param {string} testUrl - 测试URL
 * @param {string[]} cheapProxies - 1倍速率的节点
 * @param {string[]} allFilteredProxyNames - 所有过滤后的代理节点名称
 * @returns {object} 包含各类分组和可用自动分组名称的对象
 */
function buildBaseProxyGroups(testUrl, cheapProxies, allFilteredProxyNames) {
    const coreRoutingGroups = [];
    const utilityGroups = [];
    const autoSelectGroupNames = [];

    // 1. 创建 “1倍便宜货” 分组
    const nonHkCheapProxies = cheapProxies.filter(p => !/HK|Hong Kong|香港|港/i.test(p));
    if (nonHkCheapProxies.length > 0) {
        const groupName = '1倍便宜货';
        utilityGroups.push({
            name: groupName,
            type: 'url-test',
            proxies: nonHkCheapProxies,
            url: testUrl,
            interval: CONFIG.testInterval,
            tolerance: CONFIG.tolerance,
            lazy: true,
            timeout: 5000,
            "expected-status": 204,
            icon: 'https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Pig.png'
        });
        autoSelectGroupNames.push(groupName);
    }

    // 2. 创建指定的地区分组
    const primaryRegionConfig = {
        'HK': ['Hong Kong', '香港', '港'],
        'SG': ['Singapore', '新加坡', '狮城', '坡'],
        'JP': ['Japan', '日本', '日'],
        'US': ['United States', '美国', '美'],
    };

    let assignedProxies = new Set();

    for (const [code, keywords] of Object.entries(primaryRegionConfig)) {
        const groupName = `${code} AUTO`;
        const regex = new RegExp(`${code}|${keywords.join('|')}`, 'i');
        const regionalProxies = allFilteredProxyNames.filter(p => regex.test(p));

        if (regionalProxies.length > 0) {
            regionalProxies.forEach(p => assignedProxies.add(p));
            utilityGroups.push({
                name: groupName,
                type: 'url-test',
                proxies: regionalProxies,
                url: testUrl,
                interval: CONFIG.testInterval,
                tolerance: CONFIG.tolerance,
                lazy: true,
                timeout: 5000,
                "expected-status": 204,
                icon: `https://testingcf.jsdelivr.net/gh/Orz-3/mini@master/Color/${code}.png`
            });
            autoSelectGroupNames.push(groupName);
        }
    }

    // 3. 创建 "ET AUTO" 分组
    const otherProxies = allFilteredProxyNames.filter(p => !assignedProxies.has(p));
    if (otherProxies.length > 0) {
        const groupName = 'ET AUTO';
        utilityGroups.push({
            name: groupName,
            type: 'url-test',
            proxies: otherProxies,
            url: testUrl,
            interval: CONFIG.testInterval,
            tolerance: CONFIG.tolerance,
            lazy: true,
            timeout: 5000,
            "expected-status": 204,
            icon: 'https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Area.png',
        });
        autoSelectGroupNames.push(groupName);
    }

    // 4. 创建 AUTO 组
    const autoSelectAllGroup = {
        name: "AUTO",
        type: "url-test",
        tolerance: CONFIG.tolerance,
        proxies: allFilteredProxyNames,
        url: testUrl,
        interval: CONFIG.testInterval,
        lazy: true,
        timeout: 5000,
        "expected-status": 204
    };
    if (GROUP_ICONS[autoSelectAllGroup.name]) {
        autoSelectAllGroup.icon = GROUP_ICONS[autoSelectAllGroup.name];
    }
    utilityGroups.push(autoSelectAllGroup);
    autoSelectGroupNames.push(autoSelectAllGroup.name);

    // 5. 创建 手动选择 组
    const manualSelectGroup = {
        name: "手动选择",
        type: "select",
        proxies: allFilteredProxyNames
    };
    if (GROUP_ICONS[manualSelectGroup.name]) {
        manualSelectGroup.icon = GROUP_ICONS[manualSelectGroup.name];
    }
    utilityGroups.push(manualSelectGroup);

    // 6. 创建核心分流规则组
    const baseRuleGroupsData = [
        {
            name: "直连-国内网站",
            type: "select",
            proxies: ["DIRECT", ...autoSelectGroupNames, "手动选择"],
            url: "https://www.baidu.com/favicon.ico"
        },
        {
            name: "兜底-国外网站",
            type: "select",
            proxies: [...autoSelectGroupNames, "DIRECT", "手动选择"],
            url: "https://www.bing.com/favicon.ico"
        },
        {
            name: "代理-被墙网站",
            type: "select",
            proxies: [...autoSelectGroupNames, "DIRECT", "手动选择"],
            url: testUrl
        }
    ];

    baseRuleGroupsData.forEach(groupData => {
        if (GROUP_ICONS[groupData.name]) {
            groupData.icon = GROUP_ICONS[groupData.name];
        }
        coreRoutingGroups.push(groupData);
    });

    return { coreRoutingGroups, utilityGroups, autoSelectGroupNames };
}