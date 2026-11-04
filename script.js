(() => {
  "use strict";
  const SUBJECTS = ["Mathematics", "Science", "English", "Computer"];
  const PASS_MARK = 40;
  const COLORS = { Excellent: "#20a477", Good: "#4f8fbd", Average: "#e5a34b", "Needs Improvement": "#d97870" };
  const $ = id => document.getElementById(id);
  let allStudents = [];
  let filteredStudents = [];
  let charts = {};

  function showMessage(message, type = "error") {
    const el = $("message");
    el.textContent = message;
    el.className = `message ${type}`;
    if (type === "success") setTimeout(() => { if (el.textContent === message) el.className = "message"; }, 4500);
  }
  function average(values) { return values.length ? values.reduce((a,b) => a+b,0) / values.length : 0; }
  function number(value) {
    if (value === null || value === undefined || String(value).trim() === "") return null;
    const n = Number(String(value).replace("%","").trim());
    return Number.isFinite(n) ? n : null;
  }
  function normalizeHeader(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function parseCSV(text) {
    const rows = []; let row = [], field = "", quoted = false;
    for (let i=0; i<text.length; i++) {
      const c = text[i], next = text[i+1];
      if (c === '"' && quoted && next === '"') { field += '"'; i++; }
      else if (c === '"') quoted = !quoted;
      else if (c === "," && !quoted) { row.push(field); field = ""; }
      else if ((c === "\n" || c === "\r") && !quoted) {
        if (c === "\r" && next === "\n") i++;
        row.push(field); if (row.some(v => v.trim() !== "")) rows.push(row);
        row = []; field = "";
      } else field += c;
    }
    if (quoted) throw new Error("The CSV contains an unclosed quotation mark.");
    if (field.length || row.length) { row.push(field); if (row.some(v => v.trim() !== "")) rows.push(row); }
    if (rows.length < 2) throw new Error("The CSV must contain a header row and at least one student record.");
    const headers = rows.shift().map(normalizeHeader);
    const aliases = {
      id: ["studentid","id","rollno","rollnumber","studentno"],
      name: ["studentname","name","fullname"],
      attendance: ["attendance","attendancepercent","attendancepercentage","attendancerate"],
      mathematics: ["mathematics","math","maths"],
      science: ["science"],
      english: ["english"],
      computer: ["computer","computerscience","computing"]
    };
    const indexes = {};
    Object.entries(aliases).forEach(([key, names]) => indexes[key] = headers.findIndex(h => names.includes(h)));
    const missing = ["name", ...SUBJECTS.map(s => s.toLowerCase())].filter(k => indexes[k] < 0);
    if (missing.length) throw new Error(`Missing required column(s): ${missing.join(", ")}. Required: Name, Mathematics, Science, English, Computer. Attendance and ID are recommended.`);
    const valid = [];
    rows.forEach((r, i) => {
      const name = r[indexes.name]?.trim();
      const marks = {};
      SUBJECTS.forEach(s => marks[s] = number(r[indexes[s.toLowerCase()]]));
      const attendance = indexes.attendance >= 0 ? number(r[indexes.attendance]) : 100;
      if (!name || SUBJECTS.some(s => marks[s] === null || marks[s] < 0 || marks[s] > 100) || attendance === null || attendance < 0 || attendance > 100) return;
      valid.push(makeStudent({
        id: indexes.id >= 0 && r[indexes.id]?.trim() ? r[indexes.id].trim() : `STU-${String(i+1).padStart(3,"0")}`,
        name, ...marks, attendance
      }));
    });
    if (!valid.length) throw new Error("No valid student rows found. Check that marks and attendance are numbers between 0 and 100.");
    return { students: valid, skipped: rows.length - valid.length };
  }
  function categoryFor(avg) {
    if (avg >= 85) return "Excellent";
    if (avg >= 70) return "Good";
    if (avg >= 50) return "Average";
    return "Needs Improvement";
  }
  function makeStudent(raw) {
    const marks = Object.fromEntries(SUBJECTS.map(s => [s, raw[s]]));
    const avg = average(Object.values(marks));
    return { id: String(raw.id), name: String(raw.name), marks, attendance: raw.attendance, average: avg, category: categoryFor(avg) };
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }
  function getFiltered() {
    const subject = $("subjectFilter").value;
    const category = $("categoryFilter").value;
    const attendance = $("attendanceFilter").value;
    const query = $("searchInput").value.trim().toLowerCase();
    filteredStudents = allStudents.filter(s => {
      if (category !== "all" && s.category !== category) return false;
      if (attendance === "low" && s.attendance >= 75) return false;
      if (attendance === "healthy" && s.attendance < 75) return false;
      if (query && !(`${s.name} ${s.id}`.toLowerCase().includes(query))) return false;
      if (subject !== "all" && s.marks[subject] === null) return false;
      return true;
    });
    $("filterNote").textContent = `Showing ${filteredStudents.length} of ${allStudents.length} student records`;
  }
  function setText(id, value) { $(id).textContent = value; }
  function updateStats() {
    const students = filteredStudents;
    const subject = $("subjectFilter").value;
    const scores = students.flatMap(s => subject === "all" ? Object.values(s.marks) : [s.marks[subject]]);
    const validScores = scores.filter(Number.isFinite);
    const total = students.length, avg = average(validScores);
    const individualScores = students.flatMap(st => SUBJECTS
      .filter(sub => subject === "all" || sub === subject)
      .map(sub => ({ student: st, subject: sub, mark: st.marks[sub] })));
    const highest = individualScores.length ? individualScores.reduce((a,b) => a.mark > b.mark ? a : b) : null;
    const lowest = individualScores.length ? individualScores.reduce((a,b) => a.mark < b.mark ? a : b) : null;
    const passed = students.filter(s => Object.values(s.marks).every(m => m >= PASS_MARK)).length;
    const failed = total - passed;
    setText("totalStudents", total);
    setText("averageMarks", validScores.length ? avg.toFixed(1) : "—");
    setText("highestMarks", highest ? highest.mark.toFixed(0) : "—");
    setText("lowestMarks", lowest ? lowest.mark.toFixed(0) : "—");
    setText("highestName", highest ? `${highest.student.name} · ${highest.subject}` : "No records");
    setText("lowestName", lowest ? `${lowest.student.name} · ${lowest.subject}` : "No records");
    setText("passRate", total ? `${(passed/total*100).toFixed(1)}%` : "—");
    setText("passFailText", `${passed} / ${failed}`);
  }
  function destroyChart(key) { if (charts[key]) { charts[key].destroy(); delete charts[key]; } }
  function updateSubjectChart() {
    const students = filteredStudents;
    const labels = SUBJECTS;
    const values = labels.map(s => average(students.map(st => st.marks[s]).filter(Number.isFinite)));
    destroyChart("subject");
    charts.subject = new Chart($("subjectChart"), {
      type: "bar",
      data: { labels, datasets: [{ label: "Average marks", data: values, backgroundColor: ["#183b61","#18a99b","#69b5b0","#8ca5c0"], borderRadius: 6, maxBarThickness: 44 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${c.raw.toFixed(1)} / 100`}}}, scales:{y:{beginAtZero:true,max:100,grid:{color:"#eef1f4"},ticks:{font:{size:9},color:"#8996a5"}},x:{grid:{display:false},ticks:{font:{size:10},color:"#68798c"}}} }
    });
    const ranked = labels.map((s,i)=>({name:s,value:values[i]})).sort((a,b)=>b.value-a.value);
    setText("subjectInsight", students.length ? `Best: ${ranked[0].name} (${ranked[0].value.toFixed(1)}) · Needs focus: ${ranked[ranked.length-1].name} (${ranked[ranked.length-1].value.toFixed(1)})` : "No subject data for the current filters.");
  }
  function updatePerformanceChart() {
    const categories = ["Excellent","Good","Average","Needs Improvement"];
    const counts = categories.map(c=>filteredStudents.filter(s=>s.category===c).length);
    destroyChart("performance");
    charts.performance = new Chart($("performanceChart"), {
      type:"doughnut",
      data:{labels:categories,datasets:[{data:counts,backgroundColor:categories.map(c=>COLORS[c]),borderWidth:3,borderColor:"#fff",hoverOffset:5}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:"73%",plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${c.label}: ${c.raw}`}}}}
    });
    setText("donutTotal",filteredStudents.length);
    $("performanceLegend").innerHTML = categories.map((c,i)=>`<span class="legend-item"><i class="legend-dot" style="background:${COLORS[c]}"></i>${c} <b>${counts[i]}</b></span>`).join("");
  }
  function updateAttendanceChart() {
    const buckets = ["Below 60%","60–74%","75–89%","90–100%"];
    const counts = [0,0,0,0];
    filteredStudents.forEach(s => { const a=s.attendance; if(a<60)counts[0]++;else if(a<75)counts[1]++;else if(a<90)counts[2]++;else counts[3]++; });
    destroyChart("attendance");
    charts.attendance = new Chart($("attendanceChart"), {
      type:"bar",
      data:{labels:buckets,datasets:[{data:counts,label:"Students",backgroundColor:["#d97870","#e5a34b","#4f8fbd","#20a477"],borderRadius:5,maxBarThickness:55}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{precision:0,font:{size:9}},grid:{color:"#eef1f4"}},x:{grid:{display:false},ticks:{font:{size:9}}}}}
    });
    setText("averageAttendance",filteredStudents.length?`${average(filteredStudents.map(s=>s.attendance)).toFixed(1)}%`:"—");
    const low=filteredStudents.filter(s=>s.attendance<75).sort((a,b)=>a.attendance-b.attendance);
    $("lowAttendance").innerHTML = `<i class="fa-solid fa-circle-info"></i>${low.length ? `<strong>${low.length} student${low.length===1?"":"s"}</strong> below 75% attendance: ${low.slice(0,5).map(s=>`${escapeHTML(s.name)} (${s.attendance}%)`).join(", ")}${low.length>5?` and ${low.length-5} more`:""}.` : "No students below 75% attendance in the current view."}`;
  }
  function updateInsights() {
    const students=filteredStudents, grid=$("insightsGrid");
    if(!students.length){grid.innerHTML='<div class="insight-card"><div class="insight-icon"><i class="fa-solid fa-circle-info"></i></div><div><strong>No insights available</strong><p>Change your filters or upload valid student records to generate findings.</p></div></div>';return;}
    const subjectAvgs=SUBJECTS.map(s=>({name:s,value:average(students.map(st=>st.marks[s]))})).sort((a,b)=>b.value-a.value);
    const low=students.filter(s=>s.attendance<75);
    const categories=["Excellent","Good","Average","Needs Improvement"].map(c=>({name:c,count:students.filter(s=>s.category===c).length})).sort((a,b)=>b.count-a.count);
    const pass=students.filter(s=>Object.values(s.marks).every(m=>m>=PASS_MARK)).length;
    const cards=[
      ["fa-trophy","Strongest subject",`${subjectAvgs[0].name} leads with an average of ${subjectAvgs[0].value.toFixed(1)} marks. ${subjectAvgs[3].name} is the lowest at ${subjectAvgs[3].value.toFixed(1)} and may need additional support.`],
      ["fa-bullseye","Learning outcomes",`${(pass/students.length*100).toFixed(1)}% of students passed all four subjects (at least ${PASS_MARK} in each). ${categories[0].count} student(s) are in the ${categories[0].name} category.`],
      ["fa-calendar-check","Attendance watch",`${low.length} student(s) have attendance below 75%. Average attendance is ${average(students.map(s=>s.attendance)).toFixed(1)}%; follow up with students who are frequently absent.`]
    ];
    grid.innerHTML=cards.map(c=>`<article class="insight-card"><div class="insight-icon"><i class="fa-solid ${c[0]}"></i></div><div><strong>${c[1]}</strong><p>${c[2]}</p></div></article>`).join("");
  }
  function updateTable() {
    const body=$("studentTableBody"), rows=filteredStudents;
    body.innerHTML=rows.map(s=>{
      const initials=s.name.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase();
      const categoryClass=s.category.toLowerCase().replace(/\s+/g,"-");
      return `<tr><td><span class="student-cell"><span class="student-avatar">${escapeHTML(initials)}</span>${escapeHTML(s.name)}</span></td><td>${escapeHTML(s.id)}</td>${SUBJECTS.map(sub=>`<td class="score">${s.marks[sub].toFixed(0)}</td>`).join("")}<td class="score">${s.average.toFixed(1)}</td><td class="${s.attendance<75?"attendance-low":""}">${s.attendance.toFixed(0)}%</td><td><span class="category-pill ${categoryClass}">${s.category}</span></td></tr>`;
    }).join("");
    $("emptyState").hidden=rows.length!==0;
    $("studentTableBody").parentElement.style.display=rows.length?"table":"none";
    setText("recordCount",`${rows.length} record${rows.length===1?"":"s"}`);
    setText("tableFooterText",`Showing ${rows.length} of ${allStudents.length} students`);
  }
  function render() {
    getFiltered(); updateStats(); updateSubjectChart(); updatePerformanceChart(); updateAttendanceChart(); updateInsights(); updateTable();
  }
  function populateSubjects() {
    $("subjectFilter").innerHTML='<option value="all">All subjects</option>'+SUBJECTS.map(s=>`<option value="${s}">${s}</option>`).join("");
  }
  function csvCell(value) { const s=String(value ?? ""); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; }
  function downloadCSV(filename, rows) {
    if(!rows.length){showMessage("There are no records to export for the current selection.");return;}
    const csv=rows.map(row=>row.map(csvCell).join(",")).join("\r\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob), a=document.createElement("a");
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  function exportSummary() {
    const s=filteredStudents, scores=s.flatMap(st=>Object.values(st.marks));
    const pass=s.filter(st=>Object.values(st.marks).every(m=>m>=PASS_MARK)).length;
    const lines=[["Metric","Value"],["Total students",s.length],["Average marks",average(scores).toFixed(2)],["Highest student average",s.length?Math.max(...s.map(st=>st.average)).toFixed(2):"N/A"],["Lowest student average",s.length?Math.min(...s.map(st=>st.average)).toFixed(2):"N/A"],["Students passed all subjects",pass],["Students failed one or more subjects",s.length-pass],["Pass percentage",s.length?(pass/s.length*100).toFixed(2)+"%":"N/A"],["Average attendance",s.length?average(s.map(st=>st.attendance)).toFixed(2)+"%":"N/A"],...SUBJECTS.map(sub=>[`Average ${sub}`,s.length?average(s.map(st=>st.marks[sub])).toFixed(2):"N/A"]),["Generated at",new Date().toLocaleString()]];
    downloadCSV("student-analysis-summary.csv",lines);
  }
  function loadDataset(students,name,skipped=0) {
    allStudents=students;
    $("datasetName").textContent=name;
    populateSubjects();
    $("categoryFilter").value="all";$("attendanceFilter").value="all";$("searchInput").value="";
    render();
    showMessage(`Loaded ${students.length} valid student record(s)${skipped?`; skipped ${skipped} invalid or incomplete row(s)`:""}.`,"success");
  }
  async function uploadFile(file) {
    if(!file)return;
    if(!file.name.toLowerCase().endsWith(".csv")){showMessage("Please choose a CSV file (.csv).");return;}
    try{
      const content=await file.text();
      const parsed=parseCSV(content);
      loadDataset(parsed.students,file.name,parsed.skipped);
    }catch(err){showMessage(err.message||"Unable to read this CSV file.");}
    $("csvInput").value="";
  }
  function init() {
    $("csvInput").addEventListener("change",e=>uploadFile(e.target.files[0]));
    $("topUploadBtn").addEventListener("click",()=>$("csvInput").click());
    ["subjectFilter","categoryFilter","attendanceFilter"].forEach(id=>$(id).addEventListener("change",render));
    $("searchInput").addEventListener("input",render);
    $("resetFilters").addEventListener("click",()=>{$("subjectFilter").value="all";$("categoryFilter").value="all";$("attendanceFilter").value="all";$("searchInput").value="";render();});
    $("exportSummary").addEventListener("click",exportSummary);
    $("exportFiltered").addEventListener("click",()=>downloadCSV("filtered-student-records.csv",[["Student Name","Student ID",...SUBJECTS,"Average Marks","Attendance","Performance"],...filteredStudents.map(s=>[s.name,s.id,...SUBJECTS.map(sub=>s.marks[sub]),s.average.toFixed(2),s.attendance,s.category])]));
    $("menuToggle").addEventListener("click",()=>document.body.classList.toggle("menu-open"));
    document.querySelectorAll(".nav-link").forEach(link=>link.addEventListener("click",()=>document.body.classList.remove("menu-open")));
    fetch("sample-data.csv").then(r=>{if(!r.ok)throw new Error("Sample file unavailable");return r.text();}).then(t=>{const p=parseCSV(t);loadDataset(p.students,"sample-data.csv",p.skipped);}).catch(()=>showMessage("Sample data could not be loaded. Open this folder through a local web server, or upload your own CSV."));
  }
  document.addEventListener("DOMContentLoaded",init);
})();