import { priorityClass } from '../../utils/battery'

interface Props { priority: string }

export default function AlertBadge({ priority }: Props) {
  return <span className={priorityClass(priority)}>{priority}</span>
}
