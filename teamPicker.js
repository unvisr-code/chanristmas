async function fetchParticipants() {
    const url = `https://api.notion.com/v1/databases/${DATABASE_ID}/query`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_API_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      }
    });
  
    if (response.ok) {
      const data = await response.json();
      return data.results.map(item => ({
        id: item.id,
        name: item.properties.이름.title[0].text.content, // 이름
        col_num: item.properties.학번.number.content,
        hp_last4_num: item.properties.전번_뒤_4자리.title[0].text.content,
        team: item.properties.최종_팀.select.name || "Unassigned" // 기존 팀 정보
      }));
    } else {
      throw new Error("Failed to fetch participants");
    }
}
  
function assignTeams(participants) {
    const numTeams = 2; // 팀 수를 2로 고정
    const shuffled = participants.sort(() => Math.random() - 0.5); // 참가자 랜덤 섞기
    return Array.from({ length: numTeams }, (_, i) =>
      shuffled.filter((_, idx) => idx % numTeams === i)
    );
}
  
  // '1차_팀' 열에 팀 배정 결과를 저장하는 함수
async function assignInitialTeams(participants) {
    const teams = assignTeams(participants); // 팀 배정
  
    for (let i = 0; i < teams.length; i++) {
      for (const member of teams[i]) {
        await updateTeam(member.id, `1차_팀`, `Team ${i + 1}`); // '1차_팀' 열에 팀 저장
      }
    }
  
    // 화면에 새로 배정된 팀 출력
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = ""; // 이전 결과 지우기
    teams.forEach((team, idx) => {
      const teamDiv = document.createElement("div");
      teamDiv.innerHTML = `<h3>Team ${idx + 1}</h3><ul>${team
        .map(member => `<li>${member.name}</li>`)
        .join("")}</ul>`;
      resultsDiv.appendChild(teamDiv);
    });
}
  
  // 팀 배정 결과를 '2차_팀' 열에 저장하는 함수
async function refreshTeams(participants) {
    const teams = assignTeams(participants); // 팀 배정
  
    for (let i = 0; i < teams.length; i++) {
      for (const member of teams[i]) {
        await updateTeam(member.id, `2차_팀`, `Team ${i + 1}`); // '2차_팀' 열에 팀 저장
      }
    }
  
    // 화면에 새로 배정된 팀 출력
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = ""; // 이전 결과 지우기
    teams.forEach((team, idx) => {
      const teamDiv = document.createElement("div");
      teamDiv.innerHTML = `<h3>Team ${idx + 1}</h3><ul>${team
        .map(member => `<li>${member.name}</li>`)
        .join("")}</ul>`;
      resultsDiv.appendChild(teamDiv);
    });
}
  
  // 팀 배정 결과를 Notion에 업데이트하는 함수
async function updateTeam(pageId, columnName, teamName) {
    const url = `https://api.notion.com/v1/pages/${pageId}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${NOTION_API_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        properties: {
          [columnName]: { // '1차_팀' 또는 '2차_팀' 열을 동적으로 처리
            title: [{ text: { content: teamName } }]
          }
        }
      })
    });
  
    if (!response.ok) {
      throw new Error(`Failed to update page ${pageId}`);
    }
}
  
  // 팀 배정 버튼 이벤트 리스너
document.getElementById("assign-btn").addEventListener("click", async () => {
    try {
      const participants = await fetchParticipants(); // 참가자 데이터 가져오기
      await assignInitialTeams(participants); // '1차_팀' 열에 팀 배정
    } catch (error) {
      alert(error.message);
    }
});
  
  // 팀 새로고침 버튼 이벤트 리스너
document.getElementById("refresh-btn").addEventListener("click", async () => {
    try {
      const participants = await fetchParticipants(); // 참가자 데이터 가져오기
      await refreshTeams(participants); // '2차_팀' 열에 팀 새로고침
    } catch (error) {
      alert(error.message);
    }
});
  