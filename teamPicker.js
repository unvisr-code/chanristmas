NOTION_API_KEY = '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'
DATABASE_ID = '161530ea781980d0887aea7e4b09b14a'

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
        await updateTeam(member.id, `1차_팀`, i === 0 ? "대면팀" : "연호팀"); // 팀 이름 변경
      }
    }
  
    // 화면에 새로 배정된 팀 출력
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = ""; // 이전 결과 지우기
    teams.forEach((team, idx) => {
      const teamDiv = document.createElement("div");
      teamDiv.innerHTML = `<h3>${idx === 0 ? "대면팀" : "연호팀"}</h3><ul>${team
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
        await updateTeam(member.id, `2차_팀`, i === 0 ? "대면팀" : "연호팀"); // 팀 이름 변경
      }
    }
  
    // 화면에 새로 배정된 팀 출력
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = ""; // 이전 결과 지우기
    teams.forEach((team, idx) => {
      const teamDiv = document.createElement("div");
      teamDiv.innerHTML = `<h3>${idx === 0 ? "대면팀" : "연호팀"}</h3><ul>${team
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
                [columnName]: {
                    select: {
                        name: teamName
                    }
                }
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to update page ${pageId}`);
    }
}
  
  // 사용자 인증 함수
async function verifyUser(name, studentId, phoneLast4) {
    const participants = await fetchParticipants();
    const user = participants.find(p => 
        p.name === name && 
        p.col_num === parseInt(studentId) && 
        p.hp_last4_num === phoneLast4
    );
    
    if (!user) {
        throw new Error("입력하신 정보와 일치하는 사용자를 찾을 수 없습니다.");
    }
    
    return user;
}

// 전역 변수로 현재 사용자 정보 저장
let currentUser = null;

// 사용자 확인 버튼 이벤트 리스너
document.getElementById("verify-btn").addEventListener("click", async () => {
    try {
        const name = document.getElementById("name").value;
        const studentId = document.getElementById("student-id").value;
        const phoneLast4 = document.getElementById("phone-last4").value;

        if (!name || !studentId || !phoneLast4) {
            alert("모든 필드를 입력해주세요.");
            return;
        }

        currentUser = await verifyUser(name, studentId, phoneLast4);
        
        // 인증 성공 시 팀 배정 섹션 표시
        document.getElementById("auth-form").style.display = "none";
        document.getElementById("team-section").style.display = "block";
        
    } catch (error) {
        alert(error.message);
    }
});

// 팀 배정 버튼 이벤트 리스너 수정
document.getElementById("assign-btn").addEventListener("click", async () => {
    if (!currentUser) {
        alert("먼저 본인 확인을 해주세요.");
        return;
    }

    try {
        const participants = await fetchParticipants();
        await assignInitialTeams(participants);
        document.getElementById("refresh-btn").style.display = "inline";
        document.getElementById("assign-btn").style.display = "none";
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
  