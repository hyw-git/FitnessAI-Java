// API测试工具
export const testBackendConnection = async () => {
  console.log('=== 开始测试后端连接 ===');

  try {
    // 1. 测试基本连接
    console.log('1. 测试基本连接...');
    const exercisesResponse = await fetch('http://localhost:8080/api/exercises');
    if (exercisesResponse.ok) {
      const exercises = await exercisesResponse.json();
      console.log('✅ 获取运动列表成功，数量:', exercises.length);
    } else {
      console.error('❌ 获取运动列表失败:', exercisesResponse.status);
      return false;
    }

    // 2. 测试会话创建
    console.log('2. 测试会话创建...');
    const sessionResponse = await fetch('http://localhost:8080/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exercise_type: 'squat',
        user_id: 'test_user'
      })
    });

    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('✅ 创建会话成功, ID:', sessionData.session_id);

      // 3. 测试姿势分析
      console.log('3. 测试姿势分析...');
      const poseData = {
        pose_landmarks: Array(33).fill(null).map((_, i) => ({
          x: 0.1 + i * 0.01,
          y: 0.2 + i * 0.01,
          z: 0,
          visibility: 0.9
        })),
        exercise_type: 'squat',
        session_id: sessionData.session_id
      };

      const analysisResponse = await fetch('http://localhost:8080/api/analytics/pose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poseData)
      });

      if (analysisResponse.ok) {
        const analysis = await analysisResponse.json();
        console.log('✅ 姿势分析成功');
        console.log('  - 运动类型:', analysis.exercise_type);
        console.log('  - 反馈:', analysis.feedback);
        console.log('  - 计数:', analysis.count);
      } else {
        const errorText = await analysisResponse.text();
        console.error('❌ 姿势分析失败:', analysisResponse.status, errorText);
      }

      // 4. 结束会话
      await fetch(`http://localhost:8080/api/session/${sessionData.session_id}/end`, {
        method: 'POST'
      });

    } else {
      const errorText = await sessionResponse.text();
      console.error('❌ 创建会话失败:', sessionResponse.status, errorText);
      return false;
    }

    console.log('=== 后端连接测试完成 ===');
    return true;

  } catch (error) {
    console.error('❌ 网络连接错误:', error);
    return false;
  }
};

// 测试所有运动类型
export const testAllExerciseTypes = async () => {
  const exerciseTypes = ['squat', 'pushup', 'plank', 'jumping_jack'];

  for (const exerciseType of exerciseTypes) {
    console.log(`\n测试运动类型: ${exerciseType}`);

    try {
      // 发送姿势数据
      const poseData = {
        pose_landmarks: Array(33).fill(null).map((_, i) => ({
          x: 0.1 + i * 0.01,
          y: 0.2 + i * 0.01,
          z: 0,
          visibility: 0.9
        })),
        exercise_type: exerciseType
      };

      const analysisResponse = await fetch('http://localhost:8080/api/analytics/pose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poseData)
      });

      if (analysisResponse.ok) {
        const analysis = await analysisResponse.json();
        console.log(`  ✅ ${exerciseType} 正常工作`);
        console.log(`    - 识别的运动类型: ${analysis.exercise_type}`);
        console.log(`    - 反馈: ${analysis.feedback}`);
      } else {
        console.error(`  ❌ ${exerciseType} 分析失败`);
      }

    } catch (error) {
      console.error(`  ❌ ${exerciseType} 测试出错:`, error);
    }
  }
};