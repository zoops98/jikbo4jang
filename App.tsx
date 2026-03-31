import React, { useState, useRef, useEffect } from "react";
import { generateJikboData } from "./geminiService";
import { JikboData, AppStatus } from "./types";
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState<string>("동아(윤정미) 8과");
  const [examType, setExamType] = useState<string>("기말고사");
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [data, setData] = useState<JikboData | null>(null);
  const [error, setError] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem("ZOOP_GEMINI_API_KEY");
    if (savedKey) {
      setApiKey(savedKey);
      setTempApiKey(savedKey);
    } else if (process.env.API_KEY) {
      setApiKey(process.env.API_KEY);
      setTempApiKey(process.env.API_KEY);
    }
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem("ZOOP_GEMINI_API_KEY", tempApiKey);
    setApiKey(tempApiKey);
    setIsSettingsOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      setError("파일을 업로드해주세요.");
      return;
    }

    if (!apiKey) {
      setError("API 키가 설정되지 않았습니다. 우측 상단 설정 아이콘을 클릭하여 API 키를 입력해주세요.");
      setIsSettingsOpen(true);
      return;
    }

    setStatus(AppStatus.PROCESSING);
    setError("");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(",")[1];
        try {
          const result = await generateJikboData(
            apiKey,
            base64String,
            file.type,
            instruction
          );
          setData(result);
          setStatus(AppStatus.SUCCESS);
        } catch (err: any) {
          setError(err.message || "자료 생성에 실패했습니다.");
          setStatus(AppStatus.ERROR);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setError("파일을 읽는 중 오류가 발생했습니다.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleNewFile = () => {
    window.location.reload();
  };

  const handleExportHtml = () => {
    if (!data) return;

    const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${examType} 직전보강 - Zoops Jikbo Maker</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&display=swap');
      
      body { 
        font-family: 'Noto Sans KR', sans-serif; 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact;
        background-color: #f3f4f6;
        color: #111827; /* gray-900 */
        font-size: 9pt;
      }
      .serif { font-family: 'Noto Serif KR', serif; }
      
      /* Screen Preview Style */
      .page-container {
        width: 210mm;
        min-height: 297mm;
        background: white;
        margin: 20px auto;
        padding: 10mm; /* Reduced padding */
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;
        position: relative;
      }

      /* Print Style */
      @media print {
        body { margin: 0; background: white; }
        .page-container {
          width: 100%;
          min-height: auto;
          margin: 0;
          padding: 0;
          box-shadow: none;
          border: none;
          page-break-after: always;
        }
        .page-container:last-child {
          page-break-after: auto;
        }
        
        @page {
          size: A4;
          margin: 10mm; /* Reduced print margin */
        }

        .no-print { display: none !important; }
        .avoid-break { break-inside: avoid; }
      }
    </style>
</head>
<body>
    <!-- Vocab Section -->
    <div class="page-container">
        <!-- Header -->
        <div class="border-b-2 border-black pb-1 mb-2">
            <div class="flex justify-between items-end">
                <h1 class="text-2xl font-black tracking-tighter serif text-black">${examType} 직전보강</h1>
                <div class="flex gap-2 text-xs font-bold items-center">
                    <span class="bg-gray-200 px-2 py-0.5 rounded border border-gray-400 text-gray-900">${data.meta?.publisher || ''}</span>
                    <span class="uppercase tracking-wide text-black">${data.meta?.schoolLevel || ''} ${data.meta?.grade || ''}</span>
                    <span class="bg-black text-white px-2 py-0.5 rounded">${data.meta?.lesson || ''}</span>
                </div>
            </div>
        </div>
        
        <div class="flex gap-4 h-full text-[9pt] leading-tight">
            <div class="w-[45%] flex flex-col gap-2">
                <div class="avoid-break">
                    <h2 class="text-sm font-bold border-b-2 border-black mb-1 pb-0.5 text-black">단어의 의미관계</h2>
                    
                    <h3 class="font-bold text-[8pt] mb-0.5 bg-gray-200 px-2 py-0.5 rounded-sm inline-block text-black border border-gray-300">(1) 유의어</h3>
                    <ul class="space-y-0.5 mb-2 text-gray-900">
                        ${(data.vocab?.synonyms || []).map(item => `<li class="flex gap-1"><span class="text-black font-bold select-none">▪</span> <span>${item}</span></li>`).join('')}
                    </ul>

                    <h3 class="font-bold text-[8pt] mb-0.5 bg-gray-200 px-2 py-0.5 rounded-sm inline-block text-black border border-gray-300">(2) 반의어</h3>
                    <ul class="space-y-0.5 mb-2 text-gray-900">
                        ${(data.vocab?.antonyms || []).map(item => `<li class="flex gap-1"><span class="text-black font-bold select-none">▪</span> <span>${item}</span></li>`).join('')}
                    </ul>

                    <h3 class="font-bold text-[8pt] mb-0.5 bg-gray-200 px-2 py-0.5 rounded-sm inline-block text-black border border-gray-300">(3) 숙어/표현</h3>
                    <ul class="space-y-0.5 text-gray-900">
                        ${(data.vocab?.collocations || []).map(item => `<li class="flex gap-1"><span class="text-black font-bold select-none">▪</span> <span><span class="font-semibold text-gray-900">${item.expression}</span> <span class="text-gray-700 text-[8pt]">= ${item.meaning}</span></span></li>`).join('')}
                    </ul>
                </div>
            </div>

            <div class="w-px bg-gray-300 shrink-0"></div>

            <div class="flex-1">
                <h2 class="text-sm font-bold bg-black text-white inline-block px-3 py-0.5 mb-2 rounded-sm">영영풀이</h2>
                <div class="space-y-1">
                    ${(data.vocab?.definitions || []).map((def, i) => `
                    <div class="avoid-break border-b border-gray-200 pb-0.5 last:border-0">
                        <div class="font-bold text-blue-900 mb-0"><span class="text-black mr-1">${i+1}.</span>${def.word} <span class="text-gray-700 font-medium text-[8pt] ml-1">(${def.meaning})</span></div>
                        <div class="text-gray-900 pl-3 border-l-2 border-gray-300 text-[8.5pt] leading-tight">${def.enDefinition}</div>
                    </div>`).join('')}
                </div>
            </div>
        </div>
        <div class="absolute bottom-2 right-4 text-[8pt] font-bold text-gray-500">p.1</div>
    </div>

    <!-- Dialog Section -->
    <div class="page-container">
         <div class="bg-black text-white px-4 py-1 text-base font-bold mb-3 inline-block w-full rounded-sm shadow-sm">LISTEN & TALK</div>

         <!-- Part 1 -->
         <div class="border-2 border-black mb-3 avoid-break rounded-sm overflow-hidden text-[9pt]">
            <div class="flex border-b border-black bg-gray-100">
               <div class="w-1/6 p-1.5 font-bold flex items-center justify-center text-center border-r border-gray-300 text-black bg-gray-200 text-xs">Function 1</div>
               <div class="w-5/6 p-1.5 font-bold text-sm flex flex-col justify-center text-black">
                  <span class="text-[8pt] text-gray-700 mb-0 font-semibold uppercase tracking-wider">${data.dialog?.part1?.title || ''}</span>
                  ${data.dialog?.part1?.mainExpression || ''}
               </div>
            </div>
            <div class="p-2">
               <div class="mb-2">
                  <div class="font-bold mb-0.5 text-blue-900 text-xs">Explanation</div>
                  <p class="text-gray-900 leading-snug text-[8.5pt]">${data.dialog?.part1?.explanation || ''}</p>
               </div>
               <div class="mb-2">
                  <div class="font-bold mb-0.5 text-blue-900 text-xs">Variations</div>
                  <ul class="list-disc pl-4 space-y-0 text-gray-900 text-[8.5pt]">
                      ${(data.dialog?.part1?.variations || []).map(v => `<li>${v}</li>`).join('')}
                  </ul>
               </div>
               <div class="grid grid-cols-2 gap-2 mt-2">
                  <div class="border border-blue-200 p-1.5 rounded bg-blue-50">
                     <div class="text-center font-bold text-blue-900 text-[8pt] mb-1 uppercase border-b border-blue-200 pb-0.5">Agree / Positive</div>
                     <ul class="space-y-0.5 text-gray-900 text-[8.5pt]">
                        ${(data.dialog?.part1?.responseGood || []).map(r => `<li class="flex gap-1 items-start"><span class="text-blue-700 font-bold text-[8pt] mt-0.5">✔</span> ${r}</li>`).join('')}
                     </ul>
                  </div>
                  <div class="border border-red-200 p-1.5 rounded bg-red-50">
                     <div class="text-center font-bold text-red-900 text-[8pt] mb-1 uppercase border-b border-red-200 pb-0.5">Disagree / Negative</div>
                     <ul class="space-y-0.5 text-gray-900 text-[8.5pt]">
                        ${(data.dialog?.part1?.responseBad || []).map(r => `<li class="flex gap-1 items-start"><span class="text-red-700 font-bold text-[8pt] mt-0.5">✖</span> ${r}</li>`).join('')}
                     </ul>
                  </div>
               </div>
            </div>
         </div>

         <!-- Part 2 -->
         <div class="border-2 border-black mb-3 avoid-break rounded-sm overflow-hidden text-[9pt]">
            <div class="flex border-b border-black bg-gray-100">
               <div class="w-1/6 p-1.5 font-bold flex items-center justify-center text-center border-r border-gray-300 text-black bg-gray-200 text-xs">Function 2</div>
               <div class="w-5/6 p-1.5 font-bold text-sm flex flex-col justify-center text-black">
                  <span class="text-[8pt] text-gray-700 mb-0 font-semibold uppercase tracking-wider">${data.dialog?.part2?.title || ''}</span>
                  ${data.dialog?.part2?.mainExpression || ''}
               </div>
            </div>
            <div class="p-2">
               <div class="mb-2">
                   <div class="font-bold mb-0.5 text-blue-900 text-xs">Explanation</div>
                   <p class="text-gray-900 leading-snug text-[8.5pt]">${data.dialog?.part2?.explanation || ''}</p>
               </div>
               <div>
                   <div class="font-bold mb-0.5 text-blue-900 text-xs">Variations</div>
                   <ul class="list-disc pl-4 space-y-0 text-gray-900 text-[8.5pt]">
                      ${(data.dialog?.part2?.variations || []).map(v => `<li>${v}</li>`).join('')}
                   </ul>
               </div>
            </div>
         </div>

         <!-- Extra Table -->
         <div class="avoid-break mt-3">
            <div class="font-bold text-xs mb-1 border-l-4 border-black pl-2 text-black">Key Expressions</div>
            <table class="w-full border-collapse border border-black text-[8.5pt]">
               <thead class="bg-gray-200">
                  <tr>
                      <th class="border border-black p-1 w-1/3 text-black font-extrabold text-center">Expression</th>
                      <th class="border border-black p-1 w-1/3 text-black font-extrabold text-center">Meaning</th>
                      <th class="border border-black p-1 w-1/3 text-black font-extrabold text-center">Note</th>
                  </tr>
               </thead>
               <tbody>
                  ${(data.dialog?.extra || []).map(row => `
                    <tr class="border-b border-gray-300">
                       <td class="p-1.5 border-r border-gray-300 font-bold text-gray-900">${row.expression}</td>
                       <td class="p-1.5 border-r border-gray-300 text-gray-900 font-medium">${row.meaning}</td>
                       <td class="p-1.5 text-gray-700 text-[8pt] leading-tight">${row.note}</td>
                    </tr>`).join('')}
               </tbody>
            </table>
         </div>
         <div class="absolute bottom-2 right-4 text-[8pt] font-bold text-gray-500">p.2</div>
    </div>

    <!-- Grammar Section -->
    <div class="page-container">
         <div class="flex justify-end mb-2">
           <div class="bg-black text-white px-4 py-1 text-lg font-bold tracking-widest rounded-sm shadow-sm">GRAMMAR POINTS</div>
         </div>

         <div class="flex flex-col gap-3 text-[9pt]">
           <!-- Point 1 -->
           <div class="border-2 border-black p-3 rounded-lg avoid-break relative mt-1 bg-white">
              <span class="absolute -top-3 left-4 bg-white px-1 font-black text-lg text-blue-700 border-2 border-transparent">01.</span>
              <h2 class="text-base font-black mb-2 border-b-2 border-gray-200 pb-1 pl-14 text-black">${data.grammar?.point1?.title || ''}</h2>
              <div class="flex gap-3 mb-2">
                  <div class="w-1 bg-blue-600 rounded-full"></div>
                  <div class="flex-1">
                      <p class="font-bold text-blue-900 text-[8pt] uppercase mb-0.5 tracking-wider">Construction</p>
                      <div class="bg-blue-50 p-2 rounded font-mono text-blue-900 border border-blue-200 font-bold shadow-sm text-sm">${data.grammar?.point1?.construction || ''}</div>
                  </div>
              </div>
              <div class="mb-2 text-gray-900 leading-snug text-[9pt] bg-gray-50 p-2 rounded border border-gray-200 font-medium">
                ${data.grammar?.point1?.description || ''}
              </div>
              <div class="space-y-1">
                 ${(data.grammar?.point1?.examples || []).map((ex, i) => `
                    <div class="flex gap-2 items-start p-1.5 hover:bg-gray-100 rounded border border-transparent hover:border-gray-200 transition-colors">
                       <div class="bg-blue-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[7pt] flex-shrink-0 mt-0.5 font-bold shadow-sm">${i+1}</div>
                       <div class="flex-1">
                          <p class="font-bold text-gray-900 mb-0.5 text-[9pt]">${ex.en}</p>
                          <p class="text-gray-700 text-[8.5pt]">${ex.ko}</p>
                       </div>
                    </div>`).join('')}
              </div>
           </div>

           <!-- Point 2 -->
           <div class="border-2 border-black p-3 rounded-lg avoid-break relative mt-1 bg-white">
              <span class="absolute -top-3 left-4 bg-white px-1 font-black text-lg text-orange-600 border-2 border-transparent">02.</span>
              <h2 class="text-base font-black mb-2 border-b-2 border-gray-200 pb-1 pl-14 text-black">${data.grammar?.point2?.title || ''}</h2>
              <div class="flex gap-3 mb-2">
                  <div class="w-1.5 bg-orange-500 rounded-full"></div>
                  <div class="flex-1">
                      <p class="font-bold text-orange-900 text-[8pt] uppercase mb-0.5 tracking-wider">Construction</p>
                      <div class="bg-orange-50 p-2 rounded font-mono text-orange-900 border border-orange-200 font-bold shadow-sm text-sm">${data.grammar?.point2?.construction || ''}</div>
                  </div>
              </div>
              <div class="mb-2 text-gray-900 leading-snug text-[9pt] bg-gray-50 p-2 rounded border border-gray-200 font-medium">
                ${data.grammar?.point2?.description || ''}
              </div>
              <div class="space-y-1">
                 ${(data.grammar?.point2?.examples || []).map((ex, i) => `
                    <div class="flex gap-2 items-start p-1.5 hover:bg-gray-100 rounded border border-transparent hover:border-gray-200 transition-colors">
                       <div class="bg-orange-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[7pt] flex-shrink-0 mt-0.5 font-bold shadow-sm">${i+1}</div>
                       <div class="flex-1">
                          <p class="font-bold text-gray-900 mb-0.5 text-[9pt]">${ex.en}</p>
                          <p class="text-gray-700 text-[8.5pt]">${ex.ko}</p>
                       </div>
                    </div>`).join('')}
              </div>
           </div>
         </div>
         <div class="absolute bottom-2 right-4 text-[8pt] font-bold text-gray-500">p.3</div>
    </div>

    <!-- Reading Section -->
    <div class="page-container">
         <div class="flex justify-between items-end border-b-4 border-black pb-1 mb-4">
           <div>
              <span class="text-[8pt] text-gray-600 font-bold uppercase tracking-widest block mb-0.5">Reading Passage</span>
              <h1 class="text-xl font-black serif text-black leading-none">${data.reading?.title || ''}</h1>
           </div>
           <span class="text-xs font-serif italic text-gray-800 pb-0.5 font-bold">${data.reading?.subtitle || ''}</span>
         </div>

         <div class="flex flex-col gap-1 text-[9pt]">
            ${(data.reading?.paragraphs || []).map((p, i) => `
               <div class="flex gap-3 mb-2 avoid-break group">
                  <div class="flex-shrink-0 w-6 text-right">
                      <span class="inline-block w-5 h-5 border-2 border-gray-400 text-gray-600 rounded-full text-center leading-4 text-[8pt] font-bold font-mono">${i+1}</span>
                  </div>
                  <div class="flex-1 pb-2 border-b border-dashed border-gray-300 last:border-0">
                     <p class="text-base font-medium leading-snug font-serif text-black mb-1">${p.en}</p>
                     <div class="pl-2 border-l-4 border-gray-300 flex flex-col gap-0.5 bg-gray-50 p-1.5 rounded-r-lg">
                        <p class="text-[9.5pt] text-gray-800 leading-snug">${p.ko}</p>
                        ${p.grammarNote ? `<p class="text-[8.5pt] text-red-700 font-bold flex items-center gap-1 mt-0.5"><span class="text-[9px] bg-red-100 px-1 py-0 rounded text-red-800 border border-red-200">POINT</span> ${p.grammarNote}</p>` : ''}
                     </div>
                  </div>
               </div>`).join('')}
         </div>
         <div class="absolute bottom-2 right-4 text-[8pt] font-bold text-gray-500">p.4+</div>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Zoops_Jikbo_${examType}_${data.meta?.lesson ? data.meta.lesson.replace(/\s+/g, '_') : 'lesson'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (status === AppStatus.PROCESSING) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-10 flex flex-col items-center text-center border border-gray-100">
          <div className="mb-6 relative">
            <div className="w-24 h-24 border-4 border-blue-100 rounded-full"></div>
            <div className="w-24 h-24 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
            <DocumentTextIcon className="w-10 h-10 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">자료 생성 중...</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            AI가 업로드된 문서를 분석하여<br/>
            <span className="font-bold text-blue-600">{examType} 직전보강</span> 자료를 만들고 있습니다.
          </p>
          
          <div className="flex flex-col gap-2 w-full max-w-xs mx-auto">
             <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <span>단어 & 숙어 추출 중...</span>
             </div>
             <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                <span>대화문 핵심 표현 분석 중...</span>
             </div>
             <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                <span>문법 포인트 정리 중...</span>
             </div>
          </div>
          
          <p className="text-xs text-gray-400 mt-6">최대 1분 정도 소요될 수 있습니다.</p>
        </div>
      </div>
    );
  }

  if (status === AppStatus.SUCCESS && data) {
    return (
      <div className="bg-gray-200 min-h-screen pb-20">
        {/* Toolbar */}
        <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b shadow-sm flex items-center justify-between px-6 z-50 no-print">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-800">
              Zoops Jikbo Maker
            </h1>
            <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full">
              Ready
            </span>
          </div>
          <div className="flex gap-4">
             <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
              title="API 설정"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
             <button
              onClick={handleNewFile}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              New File
            </button>
            <button
              onClick={handleExportHtml}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export to HTML
            </button>
          </div>
        </div>
        
        {/* Settings Modal */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              
              <h2 className="text-xl font-bold text-gray-900 mb-4">API 설정</h2>
              <p className="text-sm text-gray-600 mb-4">
                자료 생성을 위해 Google Gemini API 키가 필요합니다. 
                입력하신 키는 브라우저 로컬 스토리지에만 안전하게 저장됩니다.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    placeholder="AIzaSy..."
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveApiKey}
                    className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md"
                  >
                    저장하기
                  </button>
                </div>
                
                <p className="text-[10px] text-gray-400 text-center">
                  키가 없으신가요? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-500 underline">여기서 무료로 발급</a>받으실 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Preview Content */}
        <div className="pt-24 print:pt-0 flex flex-col items-center gap-8 print:block print:gap-0">
          <SectionVocab data={data} examTitle={examType} />
          <SectionDialog data={data} />
          <SectionGrammar data={data} />
          <SectionReading data={data} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative">
      {/* Settings Button */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="absolute top-6 right-6 p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
        title="API 설정"
      >
        <Cog6ToothIcon className="w-6 h-6" />
      </button>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <h2 className="text-xl font-bold text-gray-900 mb-4">API 설정</h2>
            <p className="text-sm text-gray-600 mb-4">
              자료 생성을 위해 Google Gemini API 키가 필요합니다. 
              입력하신 키는 브라우저 로컬 스토리지에만 안전하게 저장됩니다.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="AIzaSy..."
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md"
                >
                  저장하기
                </button>
              </div>
              
              <p className="text-[10px] text-gray-400 text-center">
                키가 없으신가요? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-500 underline">여기서 무료로 발급</a>받으실 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Zoops Jikbo Maker
          </h1>
          <p className="text-gray-500 mt-2">
            Upload your textbook PDF to generate a review sheet.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시험 구분 (Exam Type)
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setExamType("중간고사")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  examType === "중간고사"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                중간고사
              </button>
              <button
                onClick={() => setExamType("기말고사")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  examType === "기말고사"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                기말고사
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              자료 정보 입력 (예: 교과서명 & 단원)
            </label>
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
              placeholder="예: 중2 동아(윤) 8과"
            />
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              file ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,image/*"
            />
            {file ? (
              <div className="text-blue-600 font-medium flex flex-col items-center">
                <DocumentTextIcon className="w-8 h-8 mb-2" />
                {file.name}
              </div>
            ) : (
              <div className="text-gray-500 flex flex-col items-center">
                <ArrowUpTrayIcon className="w-8 h-8 mb-2" />
                <span>클릭하여 PDF 또는 이미지 업로드</span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={status === AppStatus.PROCESSING || !file}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-md transition-all ${
              status === AppStatus.PROCESSING || !file
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
            }`}
          >
            {status === AppStatus.PROCESSING ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                생성 중...
              </span>
            ) : (
              "자료 생성하기"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Section Components ---

const Header: React.FC<{ data: JikboData; examTitle: string }> = ({ data, examTitle }) => (
  <div className="border-b-2 border-black pb-1 mb-2">
    <div className="flex justify-between items-end">
        <h1 className="text-2xl font-black tracking-tighter serif text-black">
        {examTitle} 직전보강
        </h1>
        <div className="flex gap-2 text-xs font-bold items-center">
            <span className="bg-gray-200 px-2 py-0.5 rounded border border-gray-400 text-gray-900">
                {data.meta?.publisher || "Publisher"}
            </span>
            <span className="uppercase tracking-wide text-black">
                {data.meta?.schoolLevel || "School"} {data.meta?.grade || "Grade"}
            </span>
            <span className="bg-black text-white px-2 py-0.5 rounded">
                {data.meta?.lesson || "Lesson"}
            </span>
        </div>
    </div>
  </div>
);

const SectionVocab: React.FC<{ data: JikboData; examTitle: string }> = ({ data, examTitle }) => {
  return (
    <div className="w-[210mm] min-h-[297mm] bg-white shadow-lg mx-auto p-[10mm] relative mb-8">
      <Header data={data} examTitle={examTitle} />
      
      <div className="flex gap-4 h-full text-[9pt] leading-tight">
        {/* Left Column: Semantic Relationships */}
        <div className="w-[45%] flex flex-col gap-2">
          <div className="avoid-break">
            <h2 className="text-sm font-bold border-b-2 border-black mb-1 pb-0.5 text-black">단어의 의미관계</h2>
            
            <h3 className="font-bold text-[8pt] mb-0.5 bg-gray-200 px-2 py-0.5 rounded-sm inline-block text-black border border-gray-300">(1) 유의어</h3>
            <ul className="space-y-0.5 mb-2">
              {(data.vocab?.synonyms || []).map((item, i) => (
                 <li key={i} className="flex gap-1">
                    <span className="text-black font-bold select-none">▪</span> 
                    <span className="text-gray-900">{item}</span>
                 </li>
              ))}
            </ul>

            <h3 className="font-bold text-[8pt] mb-0.5 bg-gray-200 px-2 py-0.5 rounded-sm inline-block text-black border border-gray-300">(2) 반의어</h3>
            <ul className="space-y-0.5 mb-2">
              {(data.vocab?.antonyms || []).map((item, i) => (
                 <li key={i} className="flex gap-1">
                    <span className="text-black font-bold select-none">▪</span> 
                    <span className="text-gray-900">{item}</span>
                 </li>
              ))}
            </ul>

            <h3 className="font-bold text-[8pt] mb-0.5 bg-gray-200 px-2 py-0.5 rounded-sm inline-block text-black border border-gray-300">(3) 숙어/표현</h3>
            <ul className="space-y-0.5">
              {(data.vocab?.collocations || []).map((item, i) => (
                 <li key={i} className="flex gap-1">
                    <span className="text-black font-bold select-none">▪</span> 
                    <span><span className="font-semibold text-gray-900">{item.expression}</span> <span className="text-gray-700 text-[8pt]">= {item.meaning}</span></span>
                 </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-gray-300 shrink-0"></div>

        {/* Right Column: Definitions */}
        <div className="flex-1">
          <h2 className="text-sm font-bold bg-black text-white inline-block px-3 py-0.5 mb-2 rounded-sm">영영풀이</h2>
          <div className="space-y-1">
             {(data.vocab?.definitions || []).map((def, i) => (
                <div key={i} className="avoid-break border-b border-gray-200 pb-0.5 last:border-0">
                  <div className="font-bold text-blue-900 mb-0">
                    <span className="text-black mr-1">{i+1}.</span> {def.word} <span className="text-gray-700 font-medium text-[8pt] ml-1">({def.meaning})</span>
                  </div>
                  <div className="text-gray-900 pl-3 border-l-2 border-gray-300 text-[8.5pt] leading-tight">
                    {def.enDefinition}
                  </div>
                </div>
             ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-2 right-4 text-[8pt] font-bold text-gray-500">p.1</div>
    </div>
  );
};

const SectionDialog: React.FC<{ data: JikboData }> = ({ data }) => {
  return (
    <div className="w-[210mm] min-h-[297mm] bg-white shadow-lg mx-auto p-[10mm] relative mb-8">
       <div className="bg-black text-white px-4 py-1 text-base font-bold mb-3 inline-block w-full rounded-sm shadow-sm">
         LISTEN & TALK
       </div>

       {/* Part 1 */}
       <div className="border-2 border-black mb-3 avoid-break rounded-sm overflow-hidden text-[9pt]">
          <div className="flex border-b border-black bg-gray-100">
             <div className="w-1/6 p-1.5 font-bold flex items-center justify-center text-center border-r border-gray-300 text-black bg-gray-200 text-xs">
                Function 1
             </div>
             <div className="w-5/6 p-1.5 font-bold text-sm flex flex-col justify-center text-black">
                <span className="text-[8pt] text-gray-700 mb-0 font-semibold uppercase tracking-wider">{data.dialog?.part1?.title || ''}</span>
                {data.dialog?.part1?.mainExpression || ''}
             </div>
          </div>
          <div className="p-2">
             <div className="mb-2">
                <div className="font-bold mb-0.5 text-blue-900 text-xs">Explanation</div>
                <p className="text-gray-900 leading-snug text-[8.5pt]">{data.dialog?.part1?.explanation || ''}</p>
             </div>
             
             <div className="mb-2">
                <div className="font-bold mb-0.5 text-blue-900 text-xs">Variations</div>
                <ul className="list-disc pl-4 space-y-0 text-gray-900 text-[8.5pt]">
                    {(data.dialog?.part1?.variations || []).map((v,i) => <li key={i}>{v}</li>)}
                </ul>
             </div>

             <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="border border-blue-200 p-1.5 rounded bg-blue-50">
                   <div className="text-center font-bold text-blue-900 text-[8pt] mb-1 uppercase border-b border-blue-200 pb-0.5">Agree / Positive</div>
                   <ul className="space-y-0.5 text-gray-900 text-[8.5pt]">
                      {(data.dialog?.part1?.responseGood || []).map((r,i) => <li key={i} className="flex gap-1 items-start"><span className="text-blue-700 font-bold text-[8pt] mt-0.5">✔</span> {r}</li>)}
                   </ul>
                </div>
                <div className="border border-red-200 p-1.5 rounded bg-red-50">
                   <div className="text-center font-bold text-red-900 text-[8pt] mb-1 uppercase border-b border-red-200 pb-0.5">Disagree / Negative</div>
                   <ul className="space-y-0.5 text-gray-900 text-[8.5pt]">
                      {(data.dialog?.part1?.responseBad || []).map((r,i) => <li key={i} className="flex gap-1 items-start"><span className="text-red-700 font-bold text-[8pt] mt-0.5">✖</span> {r}</li>)}
                   </ul>
                </div>
             </div>
          </div>
       </div>

       {/* Part 2 */}
       <div className="border-2 border-black mb-3 avoid-break rounded-sm overflow-hidden text-[9pt]">
          <div className="flex border-b border-black bg-gray-100">
             <div className="w-1/6 p-1.5 font-bold flex items-center justify-center text-center border-r border-gray-300 text-black bg-gray-200 text-xs">Function 2</div>
             <div className="w-5/6 p-1.5 font-bold text-sm flex flex-col justify-center text-black">
                <span className="text-[8pt] text-gray-700 mb-0 font-semibold uppercase tracking-wider">${data.dialog?.part2?.title || ''}</span>
                {data.dialog?.part2?.mainExpression || ''}
             </div>
          </div>
          <div className="p-2">
             <div className="mb-2">
                   <div className="font-bold mb-0.5 text-blue-900 text-xs">Explanation</div>
                   <p className="text-gray-900 leading-snug text-[8.5pt]">{data.dialog?.part2?.explanation || ''}</p>
               </div>
               <div>
                   <div className="font-bold mb-0.5 text-blue-900 text-xs">Variations</div>
                   <ul className="list-disc pl-4 space-y-0 text-gray-900 text-[8.5pt]">
                      {(data.dialog?.part2?.variations || []).map((v,i) => <li key={i}>{v}</li>)}
                   </ul>
               </div>
            </div>
         </div>

         {/* Extra Table */}
         <div class="avoid-break mt-3">
            <div class="font-bold text-xs mb-1 border-l-4 border-black pl-2 text-black">Key Expressions</div>
            <table class="w-full border-collapse border border-black text-[8.5pt]">
               <thead class="bg-gray-200">
                  <tr>
                      <th class="border border-black p-1 w-1/3 text-black font-extrabold text-center">Expression</th>
                      <th class="border border-black p-1 w-1/3 text-black font-extrabold text-center">Meaning</th>
                      <th class="border border-black p-1 w-1/3 text-black font-extrabold text-center">Note</th>
                  </tr>
               </thead>
               <tbody>
                  {(data.dialog?.extra || []).map((row, i) => (
                    <tr key={i} className="border-b border-gray-300">
                       <td class="p-1.5 border-r border-gray-300 font-bold text-gray-900">{row.expression}</td>
                       <td class="p-1.5 border-r border-gray-300 text-gray-900 font-medium">{row.meaning}</td>
                       <td class="p-1.5 text-gray-700 text-[8pt] leading-tight">{row.note}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
         <div class="absolute bottom-2 right-4 text-[8pt] font-bold text-gray-500">p.2</div>
    </div>
  );
};

const SectionGrammar: React.FC<{ data: JikboData }> = ({ data }) => {
  return (
    <div className="w-[210mm] min-h-[297mm] bg-white shadow-lg mx-auto p-[10mm] relative mb-8 text-[9pt]">
      <div className="flex justify-end mb-2">
        <div className="bg-black text-white px-4 py-1 text-lg font-bold tracking-widest rounded-sm shadow-sm">GRAMMAR POINTS</div>
      </div>

      <div className="flex flex-col gap-3">
        {/* Point 1 */}
        <div className="border-2 border-black p-3 rounded-lg avoid-break relative mt-1 bg-white">
            <span className="absolute -top-3 left-4 bg-white px-1 font-black text-lg text-blue-700 border-2 border-transparent">01.</span>
            <h2 className="text-base font-black mb-2 border-b-2 border-gray-200 pb-1 pl-14 text-black">{data.grammar?.point1?.title || ''}</h2>
            <div className="flex gap-3 mb-2">
                <div className="w-1.5 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                    <p className="font-bold text-blue-900 text-[8pt] uppercase mb-0.5 tracking-wider">Construction</p>
                    <div className="bg-blue-50 p-2 rounded font-mono text-blue-900 border border-blue-200 font-bold shadow-sm text-sm">{data.grammar?.point1?.construction || ''}</div>
                </div>
            </div>
            <div className="mb-2 text-gray-900 leading-snug text-[9pt] bg-gray-50 p-2 rounded border border-gray-200 font-medium">
              {data.grammar?.point1?.description || ''}
            </div>
            <div className="space-y-1">
                {(data.grammar?.point1?.examples || []).map((ex, i) => (
                <div key={i} className="flex gap-2 items-start p-1.5 hover:bg-gray-100 rounded border border-transparent hover:border-gray-200 transition-colors">
                    <div className="bg-blue-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[7pt] flex-shrink-0 mt-0.5 font-bold shadow-sm">{i+1}</div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-900 mb-0.5 text-[9pt]">{ex.en}</p>
                        <p className="text-gray-700 text-[8.5pt]">{ex.ko}</p>
                    </div>
                </div>
                ))}
            </div>
        </div>

        {/* Point 2 */}
        <div className="border-2 border-black p-3 rounded-lg avoid-break relative mt-1 bg-white">
            <span className="absolute -top-3 left-4 bg-white px-1 font-black text-lg text-orange-600 border-2 border-transparent">02.</span>
            <h2 className="text-base font-black mb-2 border-b-2 border-gray-200 pb-1 pl-14 text-black">{data.grammar?.point2?.title || ''}</h2>
            <div className="flex gap-3 mb-2">
                <div className="w-1.5 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                    <p className="font-bold text-orange-900 text-[8pt] uppercase mb-0.5 tracking-wider">Construction</p>
                    <div className="bg-orange-50 p-2 rounded font-mono text-orange-900 border border-orange-200 font-bold shadow-sm text-sm">{data.grammar?.point2?.construction || ''}</div>
                </div>
            </div>
            <div className="mb-2 text-gray-900 leading-snug text-[9pt] bg-gray-50 p-2 rounded border border-gray-200 font-medium">
              {data.grammar?.point2?.description || ''}
            </div>
            <div className="space-y-1">
                {(data.grammar?.point2?.examples || []).map((ex, i) => (
                <div key={i} className="flex gap-2 items-start p-1.5 hover:bg-gray-100 rounded border border-transparent hover:border-gray-200 transition-colors">
                    <div className="bg-orange-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[7pt] flex-shrink-0 mt-0.5 font-bold shadow-sm">{i+1}</div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-900 mb-0.5 text-[9pt]">{ex.en}</p>
                        <p className="text-gray-700 text-[8.5pt]">{ex.ko}</p>
                    </div>
                </div>
                ))}
            </div>
        </div>
      </div>
      <div className="absolute bottom-2 right-4 text-[8pt] font-bold text-gray-500">p.3</div>
    </div>
  );
};

const SectionReading: React.FC<{ data: JikboData }> = ({ data }) => {
  return (
    <div className="w-[210mm] min-h-[297mm] bg-white shadow-lg mx-auto p-[10mm] relative mb-8 text-[9pt]">
         <div className="flex justify-between items-end border-b-4 border-black pb-1 mb-4">
           <div>
              <span class="text-[8pt] text-gray-600 font-bold uppercase tracking-widest block mb-0.5">Reading Passage</span>
              <h1 class="text-xl font-black serif text-black leading-none">{data.reading?.title || ''}</h1>
           </div>
           <span class="text-xs font-serif italic text-gray-800 pb-0.5 font-bold">{data.reading?.subtitle || ''}</span>
         </div>

         <div class="flex flex-col gap-1">
            {(data.reading?.paragraphs || []).map((p, i) => (
               <div key={i} className="flex gap-3 mb-2 avoid-break group">
                  <div className="flex-shrink-0 w-6 text-right">
                      <span className="inline-block w-5 h-5 border-2 border-gray-400 text-gray-600 rounded-full text-center leading-4 text-[8pt] font-bold font-mono">{i+1}</span>
                  </div>
                  <div className="flex-1 pb-2 border-b border-dashed border-gray-300 last:border-0">
                     <p className="text-base font-medium leading-snug font-serif text-black mb-1">{p.en}</p>
                     <div className="pl-2 border-l-4 border-gray-300 flex flex-col gap-0.5 bg-gray-50 p-1.5 rounded-r-lg">
                        <p className="text-[9.5pt] text-gray-800 leading-snug">{p.ko}</p>
                        {p.grammarNote && (
                            <p className="text-[9pt] text-red-700 font-bold flex items-center gap-1 mt-0.5">
                                <span className="text-[9px] bg-red-100 px-1 py-0 rounded text-red-800 border border-red-200">POINT</span> {p.grammarNote}
                            </p>
                        )}
                     </div>
                  </div>
               </div>
            ))}
         </div>
         <div class="absolute bottom-2 right-4 text-[8pt] font-bold text-gray-500">p.4+</div>
    </div>
  );
};

export default App;