import React, { useEffect } from "react"
import styled from "styled-components"
import { Spacing } from "shared/styles/styles"
import { Activity } from "shared/models/activity"
import { useApi } from "shared/hooks/use-api"

export const ActivityPage: React.FC = () => {
  const [getStudents, data, loadState] = useApi<{ activity: Activity[] }>({ url: "get-activities" })

  useEffect(() => {
    getStudents()
  }, [getStudents])

  useEffect(() => {
    if (loadState === "loaded") {
      const activityList: Activity[] = data?.activity ?? []

      console.log({ activityList })
    }
  }, [data])

  return <S.Container>Activity Page</S.Container>
}

const S = {
  Container: styled.div`
    display: flex;
    flex-direction: column;
    width: 50%;
    margin: ${Spacing.u4} auto 0;
  `,
}
