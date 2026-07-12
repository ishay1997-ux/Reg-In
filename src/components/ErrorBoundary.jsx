// גדר בטיחות גלובלית: שגיאת רינדור לא-מטופלת (בכל מסך) הייתה קורסת למסך לבן שקט.
// כאן היא נתפסת ומוצג מסך שגיאה ברור עם כפתור רענון, במקום שהמשתמש יתקע בלי הסבר.

import { Component } from 'react'
import { Button } from '@/components/ui/button'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('שגיאת רינדור לא-מטופלת:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center"
      >
        <p className="text-4xl">😕</p>
        <h1 className="text-xl font-bold text-slate-800">משהו השתבש</h1>
        <p className="max-w-sm text-slate-500">
          קרתה שגיאה בלתי צפויה במסך. רענון הדף בדרך כלל פותר את זה. אם זה חוזר — פנה למנכ״ל.
        </p>
        <Button onClick={this.handleReload}>רענן את הדף</Button>
      </div>
    )
  }
}
